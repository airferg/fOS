# Proactive AI System - Setup Guide

## Overview

The proactive AI system enables FounderOS to monitor your startup and automatically initiate conversations when important changes occur.

## Architecture

### Components

1. **Event Detection System** - Monitors changes in budget, calendar, roadmap, etc.
2. **Proactive Agent Engine** - Generates AI messages based on events
3. **Vector Database (pgvector)** - Stores conversation history for context-aware responses
4. **Background Jobs** - Periodic checks for events (every 15 minutes)
5. **Chat Interface** - Displays AI-initiated messages

## Setup Steps

### 1. Run Database Migrations

Run these migrations in Supabase SQL Editor:

1. `migrations/004_proactive_ai.sql` - Main schema (events, messages, conversations, etc.)
2. `migrations/005_proactive_functions.sql` - Vector search functions

**Important**: The `004_proactive_ai.sql` migration requires the `pgvector` extension. Supabase should have this enabled by default, but verify:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Environment Variables

Add to `.env.local`:

```bash
# Optional: Secret for cron job endpoint (recommended for production)
CRON_SECRET=your-random-secret-here
```

### 3. Background Job Setup

The system includes a cron endpoint at `/api/cron/proactive-check` that runs every 15 minutes.

#### Option A: Vercel Cron (Recommended for Vercel deployments)

The `vercel.json` file is configured. Vercel will automatically run the cron job.

To set up manually:
1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Add cron job:
   - Path: `/api/cron/proactive-check`
   - Schedule: `*/15 * * * *` (every 15 minutes)
   - Optional: Add Authorization header with CRON_SECRET

#### Option B: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. Create a cron job
2. URL: `https://your-domain.com/api/cron/proactive-check`
3. Schedule: Every 15 minutes
4. Method: GET
5. Headers: `Authorization: Bearer your-cron-secret` (if using CRON_SECRET)

#### Option C: Manual Testing

You can manually trigger the proactive check:

```bash
curl https://your-domain.com/api/cron/proactive-check
```

Or call the user-specific endpoint:

```bash
# After logging in, call:
GET /api/proactive/check
```

### 4. Testing the System

#### Test Event Detection

1. Update your budget in the profile
2. Complete a roadmap item
3. Create an overdue task
4. Wait for background job to run (or manually call `/api/proactive/check`)
5. Check `/api/proactive/messages` for generated messages

#### Test Chat Interface

1. Open dashboard
2. Chat should display AI-initiated messages automatically
3. Messages are marked as "delivered" when shown

## How It Works

### Event Detection Flow

```
1. Background job runs every 15 minutes
   ↓
2. For each user:
   - Check budget changes
   - Check calendar events (when integrated)
   - Check roadmap updates
   - Check email/messages (when integrated)
   ↓
3. Store detected events in `events` table
   ↓
4. Process events through proactive agent engine
   ↓
5. Generate proactive messages
   ↓
6. Store in `proactive_messages` table
```

### Chat Flow

```
1. User opens dashboard
   ↓
2. Frontend calls GET /api/chat/proactive
   ↓
3. Backend returns pending proactive messages
   ↓
4. Messages displayed in chat (AI sends first message)
   ↓
5. Messages marked as "delivered"
   ↓
6. Stored in conversation history with embeddings
```

### Vector Search

Conversations are stored with embeddings for semantic search:

- When user asks question, system searches past conversations
- Finds relevant context using cosine similarity
- Uses context to generate better responses

## Current Event Detectors

### 1. Budget Changes
- Detects low runway (< 3 months)
- Generates urgent alerts
- Suggests fundraising actions

### 2. Roadmap Updates
- Celebrates completed tasks
- Alerts on overdue items
- Suggests next steps

### 3. Calendar Events (Planned)
- Reminds about upcoming meetings
- Suggests preparation materials
- Flags conflicts

### 4. Email/Messages (Planned)
- Detects unread important emails
- Suggests follow-ups
- Flags urgent communications

## Adding New Event Detectors

To add a new event detector:

1. Create detector function in `src/lib/proactive/event-detector.ts`:

```typescript
export async function detectYourEvent(userId: string): Promise<DetectedEvent[]> {
  // Your detection logic
  return [{
    eventType: 'your_event_type',
    eventSource: 'your_source',
    severity: 'important',
    title: 'Event Title',
    description: 'Event description',
    metadata: {}
  }]
}
```

2. Add to `detectAllEvents()` function:

```typescript
const yourEvents = await detectYourEvent(userId)
allEvents.push(...yourEvents)
```

3. The proactive engine will automatically process it and generate messages

## Message Generation

Messages are generated using GPT-4 with:

- Event context (what happened)
- User context (goals, stage, resources)
- Past conversation history (via vector search)
- Suggested actions (agent IDs)

## Priority Levels

- **urgent**: Requires immediate attention (low runway, overdue critical tasks)
- **important**: Should be addressed soon (upcoming deadlines, opportunities)
- **info**: Informational updates (completed tasks, progress)
- **low**: Nice-to-know updates

## Future Enhancements

### Planned Integrations

1. **Gmail Integration**
   - OAuth setup
   - Monitor inbox
   - Detect important emails
   - Suggest replies

2. **Google Calendar Integration**
   - OAuth setup
   - Monitor events
   - Suggest preparation
   - Flag conflicts

3. **Stripe Webhooks**
   - Payment events
   - Budget updates in real-time
   - Revenue tracking

4. **Slack Integration**
   - Monitor channels
   - Detect mentions
   - Suggest responses

### Advanced Features

1. **Learning System**
   - Track which suggestions user acts on
   - Improve relevance over time
   - Personalized priorities

2. **Multi-modal Detection**
   - Combine multiple events for context
   - "You completed X, have meeting with Y, budget increased - suggest investor update"

3. **Predictive Suggestions**
   - Use historical data to predict needs
   - "Based on your pattern, you usually send investor updates after fundraising events"

## Troubleshooting

### Messages Not Appearing

1. Check if events are being detected:
   ```sql
   SELECT * FROM events WHERE user_id = 'your-user-id' ORDER BY detected_at DESC LIMIT 10;
   ```

2. Check if messages are being generated:
   ```sql
   SELECT * FROM proactive_messages WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 10;
   ```

3. Check background job logs (Vercel functions logs or cron service logs)

4. Manually trigger: `GET /api/proactive/check`

### Vector Search Not Working

1. Verify pgvector extension:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

2. Check embeddings are being generated (conversations table should have non-null embeddings)

3. Verify function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'match_conversations';
   ```

### Background Jobs Not Running

1. **Vercel**: Check Vercel Dashboard → Functions → Cron Jobs
2. **External Service**: Check cron service logs
3. **Manual Testing**: Call endpoint directly to verify it works

## Cost Considerations

### OpenAI API Costs

- **Embeddings**: ~$0.00002 per 1K tokens (text-embedding-3-small)
- **Message Generation**: ~$0.01-0.03 per message (GPT-4 Turbo)

**Estimated monthly cost for 100 active users:**
- Background checks (2x per user per day): ~$0.20-0.60
- Message generation (5 messages per user per day): ~$5-15
- Embeddings (storing conversations): ~$1-3

**Total: ~$6-18/month for 100 users**

### Optimization

- Batch processing (current: processes users sequentially, could parallelize)
- Cache embeddings for similar events
- Rate limit message generation
- Only generate messages for "important" or "urgent" events

## Security

- All tables have Row Level Security (RLS)
- Users can only see their own events/messages
- Cron endpoint protected with CRON_SECRET (optional but recommended)
- OAuth tokens stored securely (when integrations added)

## Next Steps

1. ✅ Run migrations
2. ✅ Set up background jobs
3. ✅ Test event detection
4. ✅ Verify messages appear in chat
5. 🔄 Add OAuth integrations (Gmail, Calendar)
6. 🔄 Add webhook handlers (Stripe)
7. 🔄 Enhance event detectors
8. 🔄 Add learning system

---

**Questions?** Check the code comments or open an issue.

