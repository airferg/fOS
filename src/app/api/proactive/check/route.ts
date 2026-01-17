import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { detectAllEvents } from '@/lib/proactive/event-detector'
import { processEvents } from '@/lib/proactive/proactive-engine'

/**
 * Check for events and generate proactive messages
 * This endpoint is called by background jobs or can be polled
 * GET /api/proactive/check
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Detect events
    const events = await detectAllEvents(user.id)

    // Process events into proactive messages (pass authenticated client)
    const messages = await processEvents(user.id, supabase)

    return NextResponse.json({
      success: true,
      eventsDetected: events.length,
      messagesGenerated: messages.length,
      messages
    })
  } catch (error: any) {
    console.error('Proactive check error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

