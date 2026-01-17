import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Handle Calendly webhook events
 * POST /api/webhooks/calendly
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const signature = req.headers.get('calendly-webhook-signature')
    
    console.log('[Calendly Webhook] Event received:', { 
      event: body.event,
      created_at: body.created_at,
      hasSignature: !!signature 
    })

    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.CALENDLY_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      // Calendly uses HMAC-SHA256 with the webhook secret
      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex')
      
      if (computedSignature !== signature) {
        console.error('[Calendly Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Handle event
    if (body.event) {
      // Handle invitee.created events
      if (body.event === 'invitee.created') {
        console.log('[Calendly Webhook] Invitee created:', {
          invitee_uri: body.payload?.invitee_uri,
          event_uri: body.payload?.event_uri,
          name: body.payload?.invitee?.name,
          email: body.payload?.invitee?.email,
        })

        // TODO: Process invitee created event
        // You can save to database, trigger actions, send notifications, etc.
      }

      // Handle other events
      if (body.event.startsWith('invitee.')) {
        console.log('[Calendly Webhook] Invitee event:', body.event, body.payload)
      }
    }

    return NextResponse.json({ message: 'Webhook received' }, { status: 200 })
  } catch (error: any) {
    console.error('[Calendly Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

