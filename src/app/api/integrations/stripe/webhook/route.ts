/**
 * Stripe Webhook Handler
 * Receives webhook events from Stripe and processes payment events
 */

import { NextRequest, NextResponse } from 'next/server'
import { processStripeWebhook } from '@/lib/integrations/stripe-monitor'
import { storeEvents } from '@/lib/proactive/event-detector'
import { processEvents } from '@/lib/proactive/proactive-engine'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature (you'll need to install stripe package)
    // For now, we'll process the event directly
    // In production, verify the signature using Stripe SDK
    const event = JSON.parse(body)

    // Find user associated with this Stripe customer
    const customerId = event.data?.object?.customer
    if (!customerId) {
      return NextResponse.json({ error: 'No customer ID' }, { status: 400 })
    }

    // Look up user by Stripe customer ID (stored in metadata or separate table)
    // For now, we'll need to add a stripe_customer_id column to users table
    // Or store it in integration_tokens metadata
    const { data: token } = await supabaseAdmin
      .from('integration_tokens')
      .select('user_id')
      .eq('integration_type', 'stripe')
      .eq('metadata->>customer_id', customerId)
      .single()

    if (!token) {
      console.log(`No user found for Stripe customer ${customerId}`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = token.user_id

    // Process the webhook event
    const detectedEvent = await processStripeWebhook(userId, event)

    if (detectedEvent) {
      // Store the event
      await storeEvents(userId, [detectedEvent])

      // Generate proactive message (use admin client for webhooks)
      await processEvents(userId, supabaseAdmin)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

