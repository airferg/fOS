import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Handle Asana webhook events
 * POST /api/webhooks/asana
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const signature = req.headers.get('x-hook-signature')
    
    console.log('[Asana Webhook] Event received:', { 
      action: body.action,
      resource: body.resource,
      hasSignature: !!signature 
    })

    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.ASANA_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      // Asana uses HMAC-SHA256
      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex')
      
      if (computedSignature !== signature) {
        console.error('[Asana Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Handle task events
    if (body.action === 'added' || body.action === 'changed') {
      console.log('[Asana Webhook] Task event:', {
        resource: body.resource,
        action: body.action,
        parent: body.parent,
      })

      // TODO: Process task event
      // You can save to database, trigger actions, send notifications, etc.
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Asana Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

