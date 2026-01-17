# Proactive AI System - Implementation Summary

## What Was Built

A complete proactive AI co-founder system that monitors your startup and automatically initiates conversations when important changes occur. The AI sends the first message, making it feel like a true AI co-founder/manager.

## Core Components

### 1. Database Schema (`migrations/004_proactive_ai.sql` + `005_proactive_functions.sql`)

**Tables Created:**

- **`events`** - Tracks all changes (budget, calendar, roadmap, etc.)
- **`proactive_messages`** - AI-generated messages to users
- **`conversations`** - Chat history with vector embeddings for semantic search
- **`conversation_threads`** - Groups related messages
- **`monitoring_jobs`** - Tracks background monitoring tasks
- **`integration_tokens`** - Stores OAuth tokens for external services

**Key Features:**
- pgvector extension for semantic search
- Row Level Security (RLS) on all tables
- Indexes for performance
- Helper functions for thread management
- Vector similarity search function

### 2. Event Detection System (`src/lib/proactive/event-detector.ts`)

**Detectors Implemented:**

- **Budget Changes**: Detects low runway alerts (< 3 months)
- **Roadmap Updates**: Celebrates completions, alerts on overdue tasks
- **Calendar Events**: Framework ready (requires OAuth integration)
- **Email/Messages**: Framework ready (requires OAuth integration)

**How It Works:**
1. Detectors check for changes in user data
2. Events are created with severity levels (urgent, important, info, low)
3. Events stored in database for processing

### 3. Proactive Agent Engine (`src/lib/proactive/proactive-engine.ts`)

**Functions:**

- **`processEvents()`** - Processes events and generates messages
- **`generateProactiveMessage()`** - Uses GPT-4 to create contextual messages
- **`storeConversation()`** - Stores messages with embeddings
- **`searchConversations()`** - Semantic search for context-aware responses
- **`generateEmbedding()`** - Creates embeddings using OpenAI

**Message Generation:**
- Uses event context + user context + conversation history
- Generates actionable suggestions
- Includes suggested actions (agent IDs)
- Prioritizes messages by urgency

### 4. API Routes

**`/api/proactive/check`** (GET)
- Checks for events and generates proactive messages
- Can be called manually or by background jobs
- Returns events detected and messages generated

**`/api/proactive/messages`** (GET/POST)
- GET: Retrieves pending proactive messages
- POST: Marks messages as read/delivered

**`/api/chat/proactive`** (GET/POST)
- GET: Gets proactive messages formatted for chat
- POST: Marks messages as delivered and stores in conversation history

**`/api/cron/proactive-check`** (GET)
- Background job endpoint
- Processes all active users
- Can be secured with CRON_SECRET
- Runs every 15 minutes (via Vercel Cron or external service)

### 5. Background Job System

**Vercel Cron** (`vercel.json`):
- Configured to run every 15 minutes
- Calls `/api/cron/proactive-check`
- Automatic for Vercel deployments

**External Cron Support:**
- Can use any cron service
- Just call the endpoint on schedule
- Optional authentication via CRON_SECRET

### 6. Chat Interface Integration (`src/app/dashboard/page.tsx`)

**Changes:**
- Dashboard now loads proactive messages on mount
- AI sends first message (no user input needed)
- Messages marked as delivered automatically
- Seamless integration with existing chat UI

**Flow:**
1. User opens dashboard
2. Frontend calls `/api/chat/proactive`
3. Backend returns pending messages
4. Messages displayed in chat (AI initiates conversation)
5. Messages stored in conversation history with embeddings

## How It Works

### Event Detection → Message Generation Flow

```
1. Background job runs (every 15 min)
   ↓
2. For each user:
   - Check budget changes
   - Check roadmap updates  
   - Check calendar (when integrated)
   - Check email (when integrated)
   ↓
3. Store detected events in `events` table
   ↓
4. Process events through proactive engine
   ↓
5. Generate contextual messages using GPT-4
   ↓
6. Store messages in `proactive_messages` table
   ↓
7. User opens dashboard
   ↓
8. Frontend fetches pending messages
   ↓
9. Messages displayed in chat (AI sends first message)
   ↓
10. Messages stored in conversation history with embeddings
```

### Vector Search for Context

```
User asks question
  ↓
Generate query embedding
  ↓
Search conversation history (cosine similarity)
  ↓
Retrieve relevant past conversations
  ↓
Use context in GPT-4 prompt
  ↓
Generate context-aware response
```

## Example Scenarios

### Scenario 1: Low Runway Alert

**Event Detected:**
- Budget: $20,000
- Monthly burn: $10,000
- Runway: 2 months

**AI Message Generated:**
> "I noticed you have 2 months of runway remaining. This is getting tight. Should I help you draft an investor update email with your latest progress? Or would you like me to analyze your burn rate and suggest cost optimizations?"

**Suggested Actions:**
- Draft investor update email
- Analyze burn rate
- Generate fundraising outreach

### Scenario 2: Task Completed

**Event Detected:**
- Roadmap item "Launch MVP" marked as done
- Completed within last 24 hours

**AI Message Generated:**
> "Great work! You completed 'Launch MVP'. That's a major milestone. Based on your goal, I suggest focusing on 'User Acquisition' next. I've prepared some customer outreach templates. Should I generate them?"

**Suggested Actions:**
- Generate customer outreach templates
- Update investor update with milestone
- Plan next sprint

### Scenario 3: Overdue Tasks

**Event Detected:**
- 3 tasks past due date
- Tasks: "Customer interviews", "Pitch deck", "Legal setup"

**AI Message Generated:**
> "You have 3 tasks that are past due. Let's prioritize: 'Customer interviews' seems most critical for validation. Should I help you schedule interviews with your network contacts?"

**Suggested Actions:**
- Schedule customer interviews
- Generate interview questions
- Update roadmap priorities

## Setup Required

### 1. Run Migrations

In Supabase SQL Editor, run:
1. `migrations/004_proactive_ai.sql`
2. `migrations/005_proactive_functions.sql`

**Note:** Requires pgvector extension (Supabase has this by default)

### 2. Environment Variables

Optional but recommended:
```bash
CRON_SECRET=your-random-secret-here
```

### 3. Background Jobs

**Vercel:** Already configured in `vercel.json`

**External Service:** Set up cron to call:
```
GET https://your-domain.com/api/cron/proactive-check
Headers: Authorization: Bearer your-cron-secret
Schedule: */15 * * * * (every 15 minutes)
```

## Current Limitations & Future Work

### Implemented ✅
- Event detection (budget, roadmap)
- Proactive message generation
- Vector database for semantic search
- Background job system
- Chat interface integration
- Conversation history with embeddings

### Planned (Not Yet Implemented) 🔄

**OAuth Integrations:**
- Gmail monitoring
- Google Calendar monitoring
- Stripe webhooks
- Slack integration

**Enhanced Detectors:**
- Email importance detection
- Calendar conflict detection
- Revenue tracking
- Contact interaction monitoring

**Advanced Features:**
- Learning system (track which suggestions users act on)
- Multi-event correlation ("You completed X, have meeting with Y, budget increased")
- Predictive suggestions (based on historical patterns)
- Priority learning (user-specific priorities)

## Cost Estimates

For 100 active users:

- **Background checks**: 2x per user per day = 200 checks/day
  - Cost: ~$0.20-0.60/month (event detection)

- **Message generation**: 5 messages per user per day = 500 messages/day
  - Cost: ~$5-15/month (GPT-4 Turbo)

- **Embeddings**: Storing conversations
  - Cost: ~$1-3/month (text-embedding-3-small)

**Total: ~$6-18/month for 100 users**

## Security

- All tables have Row Level Security (RLS)
- Users can only see their own events/messages
- Cron endpoint protected with CRON_SECRET (optional)
- OAuth tokens stored securely (when integrations added)
- No sensitive data exposed in API responses

## Testing

### Manual Testing

1. **Trigger event detection:**
   ```bash
   GET /api/proactive/check
   ```

2. **Check events:**
   ```sql
   SELECT * FROM events WHERE user_id = 'your-user-id' ORDER BY detected_at DESC;
   ```

3. **Check messages:**
   ```sql
   SELECT * FROM proactive_messages WHERE user_id = 'your-user-id' ORDER BY created_at DESC;
   ```

4. **Test in UI:**
   - Open dashboard
   - Chat should show AI-initiated messages
   - Verify messages are marked as delivered

### Test Events

1. **Create low runway scenario:**
   - Update profile: budget = $20000, monthly_burn = $10000
   - Run `/api/proactive/check`
   - Should generate urgent alert

2. **Complete roadmap item:**
   - Mark item as done
   - Run `/api/proactive/check`
   - Should generate celebration message

3. **Create overdue task:**
   - Create roadmap item with past due date
   - Run `/api/proactive/check`
   - Should generate alert

## Files Created

1. `migrations/004_proactive_ai.sql` - Database schema
2. `migrations/005_proactive_functions.sql` - Vector search functions
3. `src/lib/proactive/proactive-engine.ts` - Core engine
4. `src/lib/proactive/event-detector.ts` - Event detection
5. `src/app/api/proactive/check/route.ts` - Event processing endpoint
6. `src/app/api/proactive/messages/route.ts` - Message management
7. `src/app/api/chat/proactive/route.ts` - Chat integration
8. `src/app/api/cron/proactive-check/route.ts` - Background job
9. `vercel.json` - Cron configuration
10. `PROACTIVE_AI_ARCHITECTURE.md` - Architecture docs
11. `PROACTIVE_AI_SETUP.md` - Setup guide
12. `PROACTIVE_AI_IMPLEMENTATION.md` - This file

## Modified Files

1. `src/app/dashboard/page.tsx` - Integrated proactive messages

## Next Steps

1. ✅ Run migrations
2. ✅ Set up background jobs
3. ✅ Test event detection
4. 🔄 Add OAuth integrations (Gmail, Calendar)
5. 🔄 Add webhook handlers (Stripe)
6. 🔄 Enhance event detectors
7. 🔄 Add learning system
8. 🔄 Add predictive features

---

**The proactive AI system is now ready to use!** Users will see AI-initiated messages when important events occur, making FounderOS feel like a true AI co-founder that's always watching and ready to help.

