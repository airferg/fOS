/**
 * Stripe Integration Monitor
 * Handles webhook events from Stripe for payment tracking
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { DetectedEvent } from '@/lib/proactive/event-detector'

/**
 * Process Stripe webhook event
 */
export async function processStripeWebhook(
  userId: string,
  event: any
): Promise<DetectedEvent | null> {
  const supabase = await createServerSupabaseClient()

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
    case 'charge.succeeded':
      return await handlePaymentReceived(userId, event.data.object)

    case 'invoice.payment_succeeded':
      return await handleInvoicePaid(userId, event.data.object)

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      return await handleSubscriptionChange(userId, event.data.object)

    default:
      // Log other events but don't create proactive messages
      return null
  }
}

/**
 * Handle payment received event
 */
async function handlePaymentReceived(
  userId: string,
  payment: any
): Promise<DetectedEvent> {
  const supabase = await createServerSupabaseClient()

  const amount = payment.amount / 100 // Convert from cents
  const currency = payment.currency?.toUpperCase() || 'USD'

  // Update user's funds_available
  const { data: user } = await supabase
    .from('users')
    .select('funds_available')
    .eq('id', userId)
    .single()

  const currentFunds = user?.funds_available || 0
  const newFunds = currentFunds + amount

  await supabase
    .from('users')
    .update({ funds_available: newFunds })
    .eq('id', userId)

  return {
    eventType: 'budget_change',
    eventSource: 'stripe',
    severity: 'important',
    title: `Payment Received: ${currency} ${amount.toFixed(2)}`,
    description: `A payment of ${currency} ${amount.toFixed(2)} was received. Your available funds are now ${currency} ${newFunds.toFixed(2)}.`,
    metadata: {
      amount,
      currency,
      previousFunds: currentFunds,
      newFunds,
      paymentId: payment.id,
      customerId: payment.customer,
    },
  }
}

/**
 * Handle invoice paid event
 */
async function handleInvoicePaid(userId: string, invoice: any): Promise<DetectedEvent> {
  const amount = invoice.amount_paid / 100
  const currency = invoice.currency?.toUpperCase() || 'USD'

  return {
    eventType: 'budget_change',
    eventSource: 'stripe',
    severity: 'info',
    title: `Invoice Paid: ${currency} ${amount.toFixed(2)}`,
    description: `Invoice ${invoice.number || invoice.id} was paid.`,
    metadata: {
      amount,
      currency,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
    },
  }
}

/**
 * Handle subscription change
 */
async function handleSubscriptionChange(
  userId: string,
  subscription: any
): Promise<DetectedEvent> {
  const status = subscription.status
  const plan = subscription.items?.data?.[0]?.price?.nickname || 'Unknown Plan'

  return {
    eventType: 'subscription_change',
    eventSource: 'stripe',
    severity: status === 'active' ? 'info' : 'important',
    title: `Subscription ${status === 'active' ? 'Activated' : 'Updated'}`,
    description: `Your subscription to ${plan} is now ${status}.`,
    metadata: {
      subscriptionId: subscription.id,
      status,
      plan,
    },
  }
}

