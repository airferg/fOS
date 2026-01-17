import { NextRequest, NextResponse } from 'next/server'

/**
 * Handle Slack webhook events
 * POST /api/webhooks/slack
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log('[Slack Webhook] Event received:', { type: body.type, event_type: body.event?.type })

    // Slack URL verification challenge (for Events API subscription)
    if (body.type === 'url_verification') {
      console.log('[Slack Webhook] URL verification challenge received')
      return NextResponse.json({ challenge: body.challenge })
    }

    // Handle event callback
    if (body.type === 'event_callback' && body.event) {
      const event = body.event
      
      // Handle message events
      if (event.type === 'message' && event.subtype !== 'bot_message') {
        console.log('[Slack Webhook] Message event:', {
          channel: event.channel,
          user: event.user,
          text: event.text?.substring(0, 100),
        })

        // TODO: Process message event
        // You can save to database, trigger actions, send notifications, etc.
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Slack Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

