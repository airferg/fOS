# Webhook-Based Event System

## Overview

The proactive system has been redesigned to use **webhooks and real-time subscriptions** instead of polling. This is more efficient, scalable, and provides instant updates when integrations change.

## Architecture

### 1. Webhook Event Handler (`webhook-event-handler.ts`)

All integration webhooks are processed through a centralized handler that:
- Maps webhook payloads to standardized `DetectedEvent` format
- Stores events in the database
- Triggers proactive message processing

### 2. Real-time Subscriptions (`realtime-subscriptions.ts`)

Uses Supabase real-time to detect database changes:
- Roadmap updates
- Funding changes
- Budget updates
- Contact changes

### 3. Integration Webhooks

Each integration has a webhook endpoint that:
- Verifies webhook signatures
- Maps integration-specific events to our event format
- Processes events through the centralized handler

## Supported Integrations

### Currently Supported (Webhook-Based):
- **Slack**: Message events via Slack Events API
- **Stripe**: Payment and invoice events
- **GitHub**: Issue and PR events
- **Calendly**: Booking events
- **Zoom**: Meeting events
- **Gmail**: Via Google Cloud Pub/Sub (requires setup)
- **Google Calendar**: Via Calendar Watch API (requires setup)

### Internal (Real-time Subscriptions):
- Roadmap changes
- Funding rounds
- Budget updates
- User profile changes

## Setup Requirements

### Gmail Push Notifications

Gmail requires Google Cloud Pub/Sub setup:

1. Create a Pub/Sub topic in Google Cloud Console
2. Set up Gmail watch via Gmail API
3. Create Pub/Sub subscription pointing to webhook endpoint
4. Configure webhook endpoint to handle Pub/Sub messages

### Google Calendar Push Notifications

Google Calendar uses watch channels:

1. Call Calendar API to create watch channel
2. Store channel ID and expiration
3. Handle channel notifications at webhook endpoint
4. Renew watch before expiration

### Other Integrations

Most integrations (Slack, Stripe, GitHub, etc.) handle webhook setup through their platform:
1. Go to integration settings
2. Add webhook URL: `https://yourdomain.com/api/webhooks/{integration}`
3. Subscribe to relevant events
4. Save configuration

## Webhook Endpoints

All webhook endpoints are located at:
- `/api/webhooks/{integration}/route.ts`

Current endpoints:
- `/api/webhooks/slack` - Slack Events API
- `/api/webhooks/stripe` - Stripe webhooks
- `/api/webhooks/github` - GitHub webhooks
- `/api/webhooks/calendly` - Calendly webhooks
- `/api/webhooks/zoom` - Zoom webhooks

## Migration from Polling

### Before (Polling):
```typescript
// Cron job runs every 15 minutes
detectAllEvents(userId) // Polls Gmail, Calendar APIs
  → storeEvents()
  → processEvents()
```

### After (Webhook-Based):
```typescript
// Webhook received
webhook → processWebhookEvent()
  → storeEvent()
  → processEvents()

// Or real-time subscription
database change → createEvent()
  → processEvents()
```

## Benefits

1. **Instant Updates**: Events are processed immediately when they occur
2. **Reduced API Calls**: No need to poll every 15 minutes
3. **Better Scalability**: Webhooks scale better than polling
4. **Lower Costs**: Fewer API calls = lower costs
5. **More Reliable**: No missed events between polls

## Removed/Deprecated

- `/api/cron/proactive-check` - Can be deprecated (kept for backward compatibility)
- Polling-based monitoring jobs - No longer needed
- Manual event detection - Replaced by webhooks

## Future Enhancements

1. Webhook registration API - Automatically set up webhooks when integration connects
2. Webhook retry mechanism - Handle failed webhook deliveries
3. Webhook queue system - Process webhooks asynchronously
4. Webhook analytics - Track webhook delivery and processing times

