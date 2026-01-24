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

    // Get user ID from customer email or metadata
    // Stripe webhooks should include user_id in metadata when events are created
    const customerId = event.data.object.customer
    const customerEmail = event.data.object.customer_email || event.data.object.billing_details?.email
    
    // Find user by email or Stripe customer ID
    const { createServerSupabaseClient } = await import('@/lib/supabase-server')
    const supabase = await createServerSupabaseClient()
    
    let userId: string | null = null
    
    if (customerEmail) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle()
      
      userId = userData?.id || null
    }

    if (!userId) {
      console.log('[Stripe Webhook] Could not find user for customer:', customerId)
      // Still return success to avoid retries - the event can be processed later
      return NextResponse.json({ received: true })
    }

    // Process webhook event using centralized handler
    const { processWebhookEvent } = await import('@/lib/integrations/webhook-event-handler')
    
    await processWebhookEvent(
      userId,
      'stripe',
      event.type,
      event.data.object
    )

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

