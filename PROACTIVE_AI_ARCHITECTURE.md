# Proactive AI Co-Founder Architecture

## Overview

Transforming FounderOS from reactive (user-initiated) to proactive (AI-initiated) by monitoring changes and automatically initiating conversations.

## System Components

### 1. Event Monitoring System
- Tracks changes in: funds, calendar, messages, roadmap, contacts
- Stores events in database
- Detects significant changes that require user attention

### 2. Background Job System
- Periodic checks (every 15-30 minutes)
- Event-driven triggers (webhooks from integrations)
- Monitors multiple data sources simultaneously

### 3. Vector Database (pgvector)
- Stores conversation history
- Semantic search for context-aware suggestions
- User context embeddings
- Document embeddings for relevant references

### 4. Proactive Agent Framework
- Agents that run on schedules/triggers
- Context-aware decision making
- Priority-based message generation
- Action suggestions with execution

### 5. AI-Initiated Chat System
- AI sends first message on dashboard load
- Proactive suggestions appear in chat
- Conversation history preserved
- Context-aware responses

### 6. Integration Monitoring
- OAuth integrations: Gmail, Calendar, Slack, Stripe
- Webhook handlers for real-time updates
- Periodic polling as fallback

## Data Flow

```
External Services (Gmail, Calendar, Stripe)
  ↓
Integration Layer (OAuth + Webhooks/Polling)
  ↓
Event Detection System
  ↓
Event Storage (events table)
  ↓
Proactive Agent Engine
  ↓
Context Retrieval (Vector DB)
  ↓
AI Message Generation
  ↓
Proactive Messages Table
  ↓
Chat Interface (AI-initiated)
  ↓
User Response
  ↓
Action Execution
```

## Database Schema

### Tables Needed:
1. **events** - Track all changes/events
2. **proactive_messages** - AI-initiated messages
3. **conversations** - Chat history
4. **vector_embeddings** - pgvector for semantic search
5. **monitoring_jobs** - Track background jobs
6. **integration_tokens** - OAuth tokens for services

## Implementation Plan

### Phase 1: Foundation
- [x] Database schema for events and proactive messages
- [x] Vector database setup (pgvector)
- [x] Event tracking system

### Phase 2: Monitoring
- [ ] Background job system
- [ ] Integration monitoring framework
- [ ] Event detection logic

### Phase 3: Proactive Agents
- [ ] Proactive agent framework
- [ ] Context-aware message generation
- [ ] Priority system

### Phase 4: Chat System
- [ ] AI-initiated messages
- [ ] Conversation history with vector search
- [ ] Context-aware responses

### Phase 5: Integrations
- [ ] Gmail monitoring
- [ ] Calendar monitoring
- [ ] Stripe/webhook monitoring
- [ ] Other integrations

## Key Features

### 1. Smart Event Detection
- Budget changes → "I noticed your budget changed..."
- New calendar event → "You have a meeting with X tomorrow..."
- Unread messages → "You have 5 unread emails that might need attention..."
- Roadmap updates → "Task X was completed, here's what to do next..."

### 2. Context-Aware Suggestions
- Uses vector DB to find relevant past conversations
- Considers user's current goals and stage
- Suggests actions based on Bird in Hand principle

### 3. Priority System
- Urgent: Budget alerts, calendar conflicts
- Important: New opportunities, follow-ups needed
- Informational: Updates, suggestions

### 4. Proactive Actions
- Auto-draft responses to emails
- Suggest meeting prep materials
- Flag important messages
- Track relationship changes

## Example Scenarios

### Scenario 1: Budget Alert
```
Event: Stripe webhook → Payment received
Detection: Budget increased by $5000
AI Message: "Great news! I noticed a $5,000 payment came through. 
This extends your runway by 2 months. Should I update your investor 
update email with this progress?"
```

### Scenario 2: Calendar Reminder
```
Event: Calendar check → Meeting tomorrow with investor
Detection: Meeting in 24 hours, no prep materials
AI Message: "You have a meeting with Jane from Sequoia tomorrow at 2pm. 
I've pulled your latest metrics and prepared a brief. Should I draft 
talking points?"
```

### Scenario 3: Email Follow-up
```
Event: Gmail API → Unread emails from contacts
Detection: Email from investor 3 days ago, no response
AI Message: "I noticed an email from Sarah (Investor) from 3 days ago 
that you haven't responded to. Should I draft a reply?"
```

### Scenario 4: Roadmap Progress
```
Event: Roadmap item completed
Detection: Key milestone reached
AI Message: "Congratulations! You completed 'Launch MVP'. Based on your 
goal, I suggest focusing on 'User Acquisition' next. I've prepared 
some outreach templates."
```

