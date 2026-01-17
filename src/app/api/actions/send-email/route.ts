import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateEmail } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recipients, goal, context } = await req.json()

    // Get OAuth tokens for Gmail
    const { data: tokens } = await supabaseAdmin
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single()

    if (!tokens) {
      return NextResponse.json({
        error: 'Gmail not connected. Please reconnect Google account.',
        needsAuth: true
      }, { status: 401 })
    }

    const emailResults = []

    // Generate and send emails to each recipient
    for (const recipient of recipients) {
      const emailBody = await generateEmail(recipient, goal, context)

      try {
        // Send email via Gmail API
        const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: Buffer.from(
              `To: ${recipient}\r\n` +
              `Subject: ${goal}\r\n` +
              `Content-Type: text/plain; charset=utf-8\r\n\r\n` +
              emailBody
            ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
          }),
        })

        if (gmailResponse.ok) {
          emailResults.push({ recipient, status: 'sent' })

          // Update contact's last_contacted
          await supabaseAdmin
            .from('contacts')
            .update({ last_contacted: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('email', recipient)
        } else {
          emailResults.push({ recipient, status: 'failed' })
        }
      } catch (error) {
        console.error('Email send error:', error)
        emailResults.push({ recipient, status: 'failed' })
      }
    }

    // Log action
    await supabaseAdmin.from('action_logs').insert({
      user_id: user.id,
      action_type: 'send_email',
      action_details: { recipients, goal },
      status: 'success',
      result: { emailResults },
    })

    return NextResponse.json({
      message: `Sent ${emailResults.filter(r => r.status === 'sent').length} of ${recipients.length} emails`,
      results: emailResults,
    })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}
