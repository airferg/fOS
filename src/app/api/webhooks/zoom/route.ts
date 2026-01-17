import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Handle Zoom webhook events
 * POST /api/webhooks/zoom
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const signature = req.headers.get('x-zm-signature')
    const timestamp = req.headers.get('x-zm-request-timestamp')
    
    console.log('[Zoom Webhook] Event received:', { 
      event: body.event, 
      event_ts: body.event_ts,
      hasSignature: !!signature 
    })

    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET
    if (webhookSecret && signature && timestamp) {
      const message = `v0:${timestamp}:${JSON.stringify(body)}`
      const computedSignature = `v0=${crypto
        .createHmac('sha256', webhookSecret)
        .update(message)
        .digest('hex')}`
      
      if (computedSignature !== signature) {
        console.error('[Zoom Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Handle event
    if (body.event) {
      // Handle meeting.created events
      if (body.event === 'meeting.created') {
        console.log('[Zoom Webhook] Meeting created:', {
          meeting_id: body.payload?.object?.id,
          topic: body.payload?.object?.topic,
          start_time: body.payload?.object?.start_time,
        })

        // TODO: Process meeting created event
        // You can save to database, trigger actions, send notifications, etc.
      }

      // Handle other meeting events
      if (body.event.startsWith('meeting.')) {
        console.log('[Zoom Webhook] Meeting event:', body.event, body.payload?.object)
      }
    }

    // Zoom expects 200 OK response
    return NextResponse.json({ message: 'Webhook received' }, { status: 200 })
  } catch (error: any) {
    console.error('[Zoom Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

