import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Handle Stripe webhook events
 * POST /api/webhooks/stripe
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    console.log('[Stripe Webhook] Event received:', { 
      hasSignature: !!signature 
    })

    // Verify webhook signature (required for Stripe)
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      // Stripe uses HMAC-SHA256 with timestamp and body
      const elements = signature.split(',')
      const signatureHash = elements.find(el => el.startsWith('v1='))?.split('=')[1]
      const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1]
      
      if (signatureHash && timestamp) {
        const signedPayload = `${timestamp}.${body}`
        const computedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(signedPayload)
          .digest('hex')
        
        if (computedSignature !== signatureHash) {
          console.error('[Stripe Webhook] Invalid signature')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      }
    }

    const event = JSON.parse(body)
    console.log('[Stripe Webhook] Event:', { 
      type: event.type,
      id: event.id 
    })

    // Handle invoice.paid events
    if (event.type === 'invoice.paid') {
      console.log('[Stripe Webhook] Invoice paid:', {
        invoice_id: event.data.object.id,
        customer: event.data.object.customer,
        amount: event.data.object.amount_paid,
      })

      // TODO: Process invoice paid event
      // You can save to database, trigger actions, send notifications, etc.
    }

    // Handle customer.created events
    if (event.type === 'customer.created') {
      console.log('[Stripe Webhook] Customer created:', {
        customer_id: event.data.object.id,
        email: event.data.object.email,
      })

      // TODO: Process customer created event
    }

    // Handle other payment events
    if (event.type.startsWith('payment_intent.')) {
      console.log('[Stripe Webhook] Payment intent event:', event.type, event.data.object)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

