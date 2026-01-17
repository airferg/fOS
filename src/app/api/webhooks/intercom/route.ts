import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Handle Intercom webhook events
 * POST /api/webhooks/intercom
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const signature = req.headers.get('x-hub-signature')
    
    console.log('[Intercom Webhook] Event received:', { 
      topic: body.topic,
      data: body.data,
      hasSignature: !!signature 
    })

    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.INTERCOM_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      // Intercom uses HMAC-SHA256
      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex')
      
      if (computedSignature !== signature.replace('sha256=', '')) {
        console.error('[Intercom Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Handle conversation events
    if (body.topic === 'conversation.user.created' || body.topic === 'conversation.admin.replied') {
      console.log('[Intercom Webhook] Conversation event:', {
        topic: body.topic,
        conversation_id: body.data.item.id,
        user_id: body.data.item.user?.id,
      })

      // TODO: Process conversation event
      // You can save to database, trigger actions, send notifications, etc.
    }

    // Handle user events
    if (body.topic?.startsWith('user.')) {
      console.log('[Intercom Webhook] User event:', body.topic, body.data.item)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Intercom Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

