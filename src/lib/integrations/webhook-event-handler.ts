/**
 * Webhook Event Handler
 * Processes incoming webhook events from integrations and creates events in the database
 * This replaces polling-based monitoring
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { DetectedEvent } from '@/lib/proactive/event-detector'

/**
 * Process a webhook event and create a database event
 * This is the entry point for all integration webhooks
 */
export async function processWebhookEvent(
  userId: string,
  integrationType: string,
  eventType: string,
  data: any
): Promise<void> {
  console.log(`[Webhook Handler] Processing ${integrationType} webhook: ${eventType} for user ${userId}`)

  const supabase = await createServerSupabaseClient()

  // Map webhook event to DetectedEvent format
  const detectedEvent = mapWebhookToEvent(integrationType, eventType, data, userId)

  if (!detectedEvent) {
    console.log(`[Webhook Handler] No event mapping for ${integrationType}:${eventType}`)
    return
  }

  // Store event in database
  const { error } = await supabase
    .from('events')
    .insert({
      user_id: userId,
      event_type: detectedEvent.eventType,
      event_source: integrationType,
      severity: detectedEvent.severity,
      title: detectedEvent.title,
      description: detectedEvent.description,
      metadata: {
        ...detectedEvent.metadata,
        webhookEventType: eventType,
        receivedAt: new Date().toISOString(),
      },
    })

  if (error) {
    console.error(`[Webhook Handler] Error storing event:`, error)
    throw error
  }

  console.log(`[Webhook Handler] Event stored: ${detectedEvent.title}`)

  // Trigger proactive message processing
  try {
    const { processEvents } = await import('@/lib/proactive/proactive-engine')
    await processEvents(userId, supabase)
  } catch (error: any) {
    console.error(`[Webhook Handler] Error processing events:`, error.message)
    // Don't throw - event is stored, processing can happen later
  }
}

/**
 * Map webhook payloads to DetectedEvent format
 */
function mapWebhookToEvent(
  integrationType: string,
  eventType: string,
  data: any,
  userId: string
): DetectedEvent | null {
  switch (integrationType) {
    case 'gmail':
      return mapGmailWebhook(eventType, data)
    case 'google-calendar':
    case 'google_calendar':
      return mapCalendarWebhook(eventType, data)
    case 'slack':
      return mapSlackWebhook(eventType, data)
    case 'stripe':
      return mapStripeWebhook(eventType, data)
    case 'calendly':
      return mapCalendlyWebhook(eventType, data)
    case 'github':
      return mapGithubWebhook(eventType, data)
    case 'zoom':
      return mapZoomWebhook(eventType, data)
    default:
      return null
  }
}

function mapGmailWebhook(eventType: string, data: any): DetectedEvent | null {
  if (eventType === 'email.received' || eventType === 'message.received') {
    return {
      eventType: 'email',
      eventSource: 'gmail',
      severity: isImportantEmail(data) ? 'important' : 'info',
      title: `New Email: ${data.subject || 'Untitled'}`,
      description: `Email from ${data.from || 'unknown sender'}`,
      metadata: {
        emailId: data.id || data.messageId,
        from: data.from,
        subject: data.subject,
        snippet: data.snippet,
        threadId: data.threadId,
      },
    }
  }
  return null
}

function mapCalendarWebhook(eventType: string, data: any): DetectedEvent | null {
  if (eventType === 'event.created' || eventType === 'event.updated') {
    const startTime = new Date(data.start?.dateTime || data.start?.date)
    const now = new Date()
    const hoursUntil = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    return {
      eventType: 'calendar_event',
      eventSource: 'google_calendar',
      severity: hoursUntil < 2 ? 'urgent' : hoursUntil < 24 ? 'important' : 'info',
      title: `Calendar Event: ${data.summary || 'Untitled'}`,
      description: `Event ${eventType === 'event.created' ? 'created' : 'updated'}: "${data.summary || 'Untitled'}"`,
      metadata: {
        eventId: data.id,
        summary: data.summary,
        startTime: data.start?.dateTime || data.start?.date,
        endTime: data.end?.dateTime || data.end?.date,
        location: data.location,
        attendees: data.attendees?.map((a: any) => a.email || a.emailAddress) || [],
        hoursUntil,
      },
    }
  }
  return null
}

function mapSlackWebhook(eventType: string, data: any): DetectedEvent | null {
  if (eventType === 'message') {
    return {
      eventType: 'slack_message',
      eventSource: 'slack',
      severity: data.channel_type === 'im' ? 'important' : 'info',
      title: `Slack Message in ${data.channel || 'channel'}`,
      description: data.text?.substring(0, 100) || 'New message',
      metadata: {
        channel: data.channel,
        user: data.user,
        text: data.text,
        timestamp: data.ts,
      },
    }
  }
  return null
}

function mapStripeWebhook(eventType: string, data: any): DetectedEvent | null {
  if (eventType === 'invoice.paid') {
    return {
      eventType: 'budget_change',
      eventSource: 'stripe',
      severity: 'important',
      title: 'Payment Received',
      description: `Invoice paid: $${(data.amount_paid / 100).toFixed(2)}`,
      metadata: {
        invoiceId: data.id,
        customerId: data.customer,
        amount: data.amount_paid,
        currency: data.currency,
      },
    }
  }
  if (eventType === 'charge.succeeded') {
    return {
      eventType: 'payment',
      eventSource: 'stripe',
      severity: 'info',
      title: 'Payment Processed',
      description: `Charge succeeded: $${(data.amount / 100).toFixed(2)}`,
      metadata: {
        chargeId: data.id,
        amount: data.amount,
        currency: data.currency,
      },
    }
  }
  return null
}

function mapCalendlyWebhook(eventType: string, data: any): DetectedEvent | null {
  if (eventType === 'invitee.created') {
    return {
      eventType: 'calendar_event',
      eventSource: 'calendly',
      severity: 'important',
      title: 'New Calendly Booking',
      description: `${data.invitee?.name || 'Someone'} scheduled a meeting`,
      metadata: {
        eventUri: data.event,
        inviteeUri: data.invitee?.uri,
        name: data.invitee?.name,
        email: data.invitee?.email,
        scheduledTime: data.event_timeslots?.[0]?.start_time,
      },
    }
  }
  return null
}

function mapGithubWebhook(eventType: string, data: any): DetectedEvent | null {
  if (eventType === 'issues.opened') {
    return {
      eventType: 'github_issue',
      eventSource: 'github',
      severity: 'info',
      title: `GitHub Issue: ${data.issue?.title}`,
      description: `New issue opened in ${data.repository?.full_name}`,
      metadata: {
        issueId: data.issue?.id,
        issueNumber: data.issue?.number,
        repository: data.repository?.full_name,
        title: data.issue?.title,
      },
    }
  }
  return null
}

function mapZoomWebhook(eventType: string, data: any): DetectedEvent | null {
  if (eventType === 'meeting.created') {
    return {
      eventType: 'calendar_event',
      eventSource: 'zoom',
      severity: 'info',
      title: 'Zoom Meeting Created',
      description: `Meeting: ${data.topic || 'Untitled'}`,
      metadata: {
        meetingId: data.id,
        topic: data.topic,
        startTime: data.start_time,
        duration: data.duration,
        joinUrl: data.join_url,
      },
    }
  }
  return null
}

function isImportantEmail(data: any): boolean {
  const importantKeywords = ['urgent', 'important', 'asap', 'action required', 'follow up', 'meeting']
  const subject = (data.subject || '').toLowerCase()
  const snippet = (data.snippet || '').toLowerCase()
  const text = `${subject} ${snippet}`
  
  return importantKeywords.some(keyword => text.includes(keyword))
}

/**
 * Setup webhook subscriptions when an integration is connected
 */
export async function setupWebhookSubscription(
  userId: string,
  integrationType: string
): Promise<void> {
  console.log(`[Webhook Setup] Setting up webhooks for ${integrationType} (user: ${userId})`)

  switch (integrationType) {
    case 'gmail':
      await setupGmailPushNotifications(userId)
      break
    case 'google-calendar':
    case 'google_calendar':
      await setupCalendarPushNotifications(userId)
      break
    // Other integrations handle their own webhooks via their platforms
    default:
      console.log(`[Webhook Setup] No webhook setup needed for ${integrationType}`)
  }
}

/**
 * Setup Gmail Push Notifications via Google Cloud Pub/Sub
 */
async function setupGmailPushNotifications(userId: string): Promise<void> {
  // Gmail uses Google Cloud Pub/Sub for push notifications
  // This requires:
  // 1. Creating a Pub/Sub topic
  // 2. Setting up a watch on Gmail
  // 3. Creating a subscription that points to our webhook endpoint
  
  console.log(`[Gmail Webhook] Setting up push notifications for user ${userId}`)
  
  // The actual implementation would:
  // 1. Call Gmail API to set up watch
  // 2. Create Pub/Sub subscription
  // 3. Configure webhook endpoint to receive Pub/Sub messages
  
  // For now, this is a placeholder - full implementation requires Google Cloud setup
}

/**
 * Setup Google Calendar Push Notifications
 */
async function setupCalendarPushNotifications(userId: string): Promise<void> {
  // Google Calendar uses webhook channels
  // This requires:
  // 1. Getting user's calendar token
  // 2. Creating a watch channel via Calendar API
  // 3. Handling channel notifications
  
  console.log(`[Calendar Webhook] Setting up push notifications for user ${userId}`)
  
  // The actual implementation would:
  // 1. Call Calendar API to create a watch channel
  // 2. Store channel ID and expiration
  // 3. Handle channel notifications at webhook endpoint
  
  // For now, this is a placeholder - full implementation requires Calendar API setup
}

