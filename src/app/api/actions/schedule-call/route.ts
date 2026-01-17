import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contacts, duration = 30, title } = await req.json()

    const { data: tokens } = await supabaseAdmin
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single()

    if (!tokens) {
      return NextResponse.json({
        error: 'Google Calendar not connected',
        needsAuth: true
      }, { status: 401 })
    }

    const scheduledCalls = []

    for (const contact of contacts) {
      // Find available time slot
      const startTime = new Date()
      startTime.setDate(startTime.getDate() + 2) // Schedule 2 days from now
      startTime.setHours(10, 0, 0, 0) // 10 AM

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + duration)

      // Create calendar event
      const eventResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: title || `Call with ${contact.name}`,
          description: `Startup discussion`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'America/Los_Angeles',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'America/Los_Angeles',
          },
          attendees: [{ email: contact.email }],
          conferenceData: {
            createRequest: {
              requestId: `${user.id}-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }),
      })

      if (eventResponse.ok) {
        const event = await eventResponse.json()
        scheduledCalls.push({
          contact: contact.name,
          time: startTime.toISOString(),
          link: event.htmlLink,
        })

        // Update contact
        await supabaseAdmin
          .from('contacts')
          .update({ last_contacted: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('email', contact.email)
      }
    }

    // Log action
    await supabaseAdmin.from('action_logs').insert({
      user_id: user.id,
      action_type: 'schedule_call',
      action_details: { contacts, duration },
      status: 'success',
      result: { scheduledCalls },
    })

    return NextResponse.json({
      message: `Scheduled ${scheduledCalls.length} calls`,
      calls: scheduledCalls,
    })
  } catch (error) {
    console.error('Schedule call error:', error)
    return NextResponse.json({ error: 'Failed to schedule calls' }, { status: 500 })
  }
}
