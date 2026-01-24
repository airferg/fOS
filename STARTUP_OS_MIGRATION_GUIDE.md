# FounderOS - Startup OS UI Migration Guide

This guide explains the complete migration to the new Startup OS UI featuring a left sidebar navigation, comprehensive dashboards, and interconnected AI agents.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Component Structure](#component-structure)
4. [Page Implementations](#page-implementations)
5. [AI Agent Integration](#ai-agent-integration)
6. [API Endpoints](#api-endpoints)

---

## Architecture Overview

### Layout System

**New AppLayout Component** (`src/components/AppLayout.tsx`)
- Left sidebar navigation (collapsible)
- Top header with user greeting and quick actions
- Main content area for pages
- User profile at bottom of sidebar

**Navigation Structure**:
```
📊 Overview (Dashboard)
👥 Team & Equity
🌐 Network (Contacts)
💰 Funding
🔧 Tools
📣 Marketing
💬 Communication
🗺️ Roadmap
📄 Documents
🤖 AI Agents
```

### Color Scheme & Design
- Clean, minimal SaaS design
- White/zinc/black base
- Accent colors for categories
- Dark mode support
- Tailwind CSS for all styling

---

## Database Schema

### Migration File: `migrations/004_startup_os_features.sql`

**New Tables Created**:

#### 1. `team_members`
Tracks team members with equity information.

```sql
- id, user_id, name, email, role, title
- equity_percent, vested_percent
- avatar_url, linkedin_url, bio
- start_date, is_active
- created_at, updated_at
```

**Use Cases**:
- Display team roster on Team & Equity page
- Calculate total equity distribution
- Track vesting progress
- AI can draft team updates based on changes

#### 2. `vesting_schedules`
Tracks vesting terms for each team member.

```sql
- id, team_member_id
- start_date, cliff_months, duration_months
- vesting_frequency (monthly/quarterly/annually)
- notes
```

**Use Cases**:
- Calculate current vested percentages
- Project future vesting milestones
- AI can alert on cliff dates approaching

#### 3. `tools`
Tracks all tools/software used by the team.

```sql
- id, user_id, name, category
- logo_url, website_url, description
- monthly_cost, billing_frequency
- users_connected, integration_status
- is_active, last_used_at
```

**Categories**: Engineering, Design, Communication, Marketing, Analytics, Sales, HR, Finance, Legal, Other

**Use Cases**:
- Track toolstack and costs
- Display on Tools dashboard
- AI can recommend tool consolidation
- Trigger AI actions when tools are added

#### 4. `marketing_platforms`
Social media and marketing channel metrics.

```sql
- id, user_id, platform_name, platform_handle
- followers, reach, engagement_rate, growth_rate
- posts_count, is_connected, last_synced_at
- metrics_snapshot (JSONB for detailed metrics)
```

**Platforms**: Twitter, Instagram, LinkedIn, Facebook, YouTube, TikTok, etc.

**Use Cases**:
- Display marketing dashboard
- Track growth across platforms
- AI detects declining engagement
- AI drafts content for platforms

#### 5. `funding_rounds`
Investment rounds and funding history.

```sql
- id, user_id, round_name, round_type
- amount_raised, valuation, close_date
- status (planned/raising/closed/failed)
- lead_investor, investor_count, notes
```

**Use Cases**:
- Display funding history
- Calculate total raised and runway
- AI drafts investor updates
- Trigger AI on round closures

#### 6. `investors`
Individual investor relationships.

```sql
- id, user_id, contact_id (link to contacts)
- name, firm, investment_amount, equity_percent
- funding_round_id, investment_date
- investor_type, board_seat, is_lead
```

**Use Cases**:
- Track investor relationships
- Link to contact database
- AI suggests follow-up timing
- Generate cap table visualizations

#### 7. `activity_feed`
Universal activity log across all modules.

```sql
- id, user_id, activity_type, title, description
- actor_name, actor_avatar_url
- metadata (JSONB), related_entity_type, related_entity_id
- icon, created_at
```

**Activity Types**:
- contact_added, tool_connected, funding_received
- team_joined, milestone_reached, document_created
- integration_connected, roadmap_updated

**Use Cases**:
- Display recent activity on Overview dashboard
- Provide context to AI agents
- Track all changes across platform

#### 8. `channels` & `messages`
Team communication system.

```sql
channels:
- id, user_id, name, description, channel_type
- icon, is_archived

messages:
- id, channel_id, sender_id, sender_name, message_body
- parent_message_id (for threads)
- attachments, reactions (JSONB)
- is_edited, created_at
```

**Default Channels**: general, product, marketing, fundraising

**Use Cases**:
- Internal team chat
- Threaded conversations
- AI can participate in channels
- AI monitors for important discussions

#### 9. `startup_profile`
High-level company information.

```sql
- id, user_id, company_name, tagline, description
- stage (idea/mvp/early-traction/growth/scale)
- founded_date, website_url, logo_url, industry
- total_raised, current_runway_months, burn_rate
- revenue, customer_count
```

**Use Cases**:
- Portfolio modal display
- AI uses for context in all operations
- Dashboard overview stats

---

## Component Structure

### Reusable Components

#### `DashboardCard.tsx`
Standard card component for dashboard modules.

```tsx
<DashboardCard
  title="Network Connections"
  subtitle="Your professional network"
  icon="🌐"
  trend={{ value: 12, isPositive: true, label: "vs last month" }}
  actions={<button>View All</button>}
>
  {/* Card content */}
</DashboardCard>
```

#### `StatCard.tsx`
KPI metric cards for top of dashboard.

```tsx
<StatCard
  label="Total Raised"
  value="$500K"
  icon="💰"
  subtitle="Seed Round"
  trend={{ value: 100, isPositive: true }}
/>
```

#### `ActivityFeed.tsx`
Shows recent platform activity.

```tsx
<ActivityFeed limit={10} />
```

---

## Page Implementations

### 1. Overview Dashboard (`/dashboard`)

**Layout**: 3-column grid

**Top Row** (KPI Cards):
- Network Connections (count + trend)
- Team Members (count + avatars preview)
- Active Tools (count)
- Total Raised (amount + round)

**Main Grid**:

**Column 1**:
- Recent Activity Feed
- Quick Actions panel

**Column 2**:
- Roadmap Progress
- Top Priorities
- Marketing Overview

**Column 3**:
- AI Suggestions
- Upcoming Deadlines
- Network Highlights

**API Data Sources**:
- `/api/team` - Team count
- `/api/tools` - Tools count
- `/api/funding` - Total raised
- `/api/contacts` - Network size
- `/api/activity` - Recent activity
- `/api/marketing` - Marketing stats

**AI Integration**:
- AI monitors activity feed
- Proactive messages shown in dedicated panel
- Quick execute buttons for AI suggestions

---

### 2. Team & Equity Page (`/team`)

**Features**:
- Team member list with roles and equity
- Vesting progress bars
- Equity breakdown pie chart
- Add team member form
- Individual member detail views

**Components**:
```tsx
// Team member card
<TeamMemberCard
  name="Jane Doe"
  role="Co-Founder"
  title="CEO"
  equity={50}
  vested={12.5}
  avatar="/avatars/jane.jpg"
/>

// Equity chart
<EquityChart teamMembers={teamMembers} />

// Vesting calculator
<VestingCalculator schedule={schedule} />
```

**API Endpoints**:
- `GET /api/team` - List all team members
- `POST /api/team` - Add new member
- `PUT /api/team/[id]` - Update member
- `DELETE /api/team/[id]` - Remove member

**AI Triggers**:
- New team member added → AI drafts announcement
- Equity changes → AI suggests investor update
- Vesting cliff approaching → AI reminder
- Team size threshold → AI recommends hiring process

---

### 3. Network Page (`/contacts`)

**Enhancement of existing contacts page**:
- Keep existing contact list
- Add filters by tag (Investor, Founder, Advisor, Customer)
- Last contacted sorting
- Relationship strength indicators
- Quick contact actions (email, note, schedule)

**New Features**:
- Group contacts by organization
- Relationship timeline
- Contact interaction history
- Network graph visualization (optional)

**AI Integration**:
- New contact → AI suggests categorization
- Stale relationships → AI suggests outreach
- Mutual connections → AI recommends intros
- Contact interactions → AI logs in activity feed

---

### 4. Tools Page (`/tools`)

**Layout**: Card grid with category filters

**Filters**: All, Engineering, Design, Communication, Marketing, Analytics, Sales, HR, Finance

**Tool Card**:
```tsx
<ToolCard
  name="Figma"
  category="Design"
  logo="/logos/figma.svg"
  monthlyCost={45}
  usersConnected={3}
  integrationStatus="connected"
/>
```

**Summary Stats**:
- Total tools
- Monthly cost
- Connected vs. not connected
- Most used category

**API Endpoints**:
- `GET /api/tools?category=Engineering`
- `POST /api/tools` - Add tool
- `PUT /api/tools/[id]` - Update tool
- `DELETE /api/tools/[id]` - Remove tool

**AI Triggers**:
- New tool added → AI suggests setup tasks
- High costs → AI recommends alternatives
- Duplicate functionality → AI suggests consolidation
- Integration available → AI offers to connect

---

### 5. Marketing Page (`/marketing`)

**Layout**: Platform overview grid

**Platform Cards**:
Each social platform gets a card showing:
- Platform icon and name
- Followers/subscribers count
- Reach (monthly impressions)
- Engagement rate
- Growth rate (%)
- Posts/shares count
- Connect button (if not connected)

**Aggregate Stats**:
- Total followers across platforms
- Total reach
- Average engagement
- Best performing platform

**Chart Visualizations**:
- Growth over time (line chart)
- Platform distribution (pie chart)
- Engagement comparison (bar chart)

**API Endpoints**:
- `GET /api/marketing` - All platforms
- `POST /api/marketing` - Add/update platform
- `PUT /api/marketing/[id]` - Update metrics

**AI Triggers**:
- Declining engagement → AI drafts content
- Platform imbalance → AI suggests strategy
- Viral post detected → AI recommends follow-up
- Competitor analysis → AI generates insights

---

### 6. Funding Page (`/funding`)

**Sections**:

**Funding Overview**:
- Total raised (all rounds)
- Current round status
- Runway calculator
- Burn rate monitor

**Rounds Timeline**:
```tsx
<FundingRound
  name="Seed Round"
  type="seed"
  amount="$500,000"
  valuation="$3M"
  closeDate="2024-06-15"
  status="closed"
  leadInvestor="Acme Ventures"
/>
```

**Investors List**:
- Investor cards with investment amount
- Equity percentages
- Board seat indicators
- Link to contact profile

**Cap Table** (simplified):
- Founders equity
- Investor equity
- Employee option pool
- Remaining shares

**API Endpoints**:
- `GET /api/funding` - Rounds and investors
- `POST /api/funding` - New round
- `POST /api/funding/investors` - Add investor

**AI Triggers**:
- Round closed → AI drafts thank you emails
- Runway < 6 months → AI suggests fundraising
- Investor added → AI creates follow-up reminders
- Cap table changes → AI updates investor docs

---

### 7. Communication Page (`/communication`)

**Layout**: Slack/Discord-like interface

**Left Sidebar**:
- Channel list
- Direct messages
- Create channel button

**Main Area**:
- Message thread
- Message input
- File attachments
- Reactions/emojis
- Threading support

**Channels**:
```tsx
<Channel
  name="general"
  description="General team discussion"
  icon="#"
  unreadCount={3}
  lastMessage="Great work on the launch!"
/>
```

**Message**:
```tsx
<Message
  sender="Jane Doe"
  senderAvatar="/avatars/jane.jpg"
  content="Just closed our first customer!"
  timestamp="2024-01-20T10:30:00Z"
  reactions={{ "🎉": 5, "👏": 3 }}
/>
```

**API Endpoints**:
- `GET /api/communication/channels` - List channels
- `GET /api/communication/messages?channel_id=xxx` - Get messages
- `POST /api/communication/messages` - Send message
- `POST /api/communication/channels` - Create channel

**AI Integration**:
- AI has access to channels (with permission)
- AI can post updates to channels
- AI monitors for @mentions
- AI summarizes channel activity

---

### 8. Startup Portfolio Modal

**Triggered by**: Click on company logo or "Portfolio" button

**Modal Content**:
```tsx
<StartupPortfolioModal
  companyName="FounderOS"
  tagline="AI-Powered Operating System for Founders"
  stage="Early Traction"
  totalRaised="$500K"
  runway="18 months"
  teamMembers={teamMembers}
  fundingRounds={rounds}
  metrics={{
    revenue: "$10K MRR",
    customers: 150,
    growth: "+25% MoM"
  }}
/>
```

**Sections**:
- Company overview
- Key metrics
- Team roster
- Funding history
- Current status

---

## AI Agent Integration

### Event Detection System

The AI agents monitor these tables for changes and automatically trigger actions:

#### 1. Team Changes
**Trigger**: INSERT on `team_members`
**AI Action**: Draft team announcement email
**Implementation**:
```typescript
// In /api/team POST handler
await createEvent({
  event_type: 'team_member_added',
  title: 'New team member',
  metadata: { team_member_id, name, role }
})
```

#### 2. Funding Updates
**Trigger**: UPDATE on `funding_rounds` where status='closed'
**AI Action**: Draft investor update, thank you emails
**Implementation**:
```typescript
await createProactiveMessage({
  message: 'Congratulations on closing your round! Should I draft thank you emails to your investors?',
  priority: 'important',
  suggested_actions: [
    { type: 'draft-investor-emails', label: 'Draft Emails' }
  ]
})
```

#### 3. Marketing Performance
**Trigger**: UPDATE on `marketing_platforms` where engagement_rate decreases
**AI Action**: Suggest content strategy, draft posts
**Implementation**:
```typescript
if (engagement_rate < previous_rate * 0.8) {
  await createEvent({
    event_type: 'marketing_decline',
    severity: 'important',
    metadata: { platform, old_rate, new_rate }
  })
}
```

#### 4. Tool Stack Changes
**Trigger**: INSERT on `tools`
**AI Action**: Suggest setup checklist, integration
**Implementation**:
```typescript
const recommendations = await generateToolRecommendations(tool)
await createRecommendation({
  type: 'integration',
  title: `Set up ${tool.name}`,
  can_do_agentically: hasIntegration(tool.name)
})
```

#### 5. Network Activity
**Trigger**: INSERT on `contacts` or `contact_interactions`
**AI Action**: Suggest warm intro, follow-up timing
**Implementation**:
```typescript
const mutualConnections = await findMutualConnections(contact)
if (mutualConnections.length > 0) {
  await createProactiveMessage({
    message: `I notice ${mutualConnections[0].name} knows ${contact.name}. Should I draft a warm intro request?`
  })
}
```

### AI Agent Endpoints

Create new agent-specific endpoints in `/api/agents/`:

#### `/api/agents/analyze-team`
Input: Current team composition
Output: Hiring recommendations, skill gaps

#### `/api/agents/marketing-strategy`
Input: Current marketing metrics
Output: Content calendar, platform focus

#### `/api/agents/fundraising-readiness`
Input: Current metrics, team, traction
Output: Readiness score, action items

#### `/api/agents/network-intros`
Input: Target person/company
Output: Connection paths, intro templates

---

## API Endpoints Summary

### New Endpoints Created

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/team` | GET | List team members |
| `/api/team` | POST | Add team member |
| `/api/tools` | GET | List tools |
| `/api/tools` | POST | Add tool |
| `/api/marketing` | GET | List platforms |
| `/api/marketing` | POST | Add/update platform |
| `/api/funding` | GET | List rounds & investors |
| `/api/funding` | POST | Add funding round |
| `/api/activity` | GET | Get activity feed |
| `/api/activity` | POST | Create activity |
| `/api/startup-profile` | GET | Get company profile |
| `/api/startup-profile` | POST | Update profile |
| `/api/communication/channels` | GET | List channels |
| `/api/communication/messages` | GET | Get messages |
| `/api/communication/messages` | POST | Send message |

### Enhanced Existing Endpoints

- `/api/contacts` - Now links to organizations
- `/api/roadmap` - Now creates activity feed entries
- `/api/agents/execute` - Can trigger from any module

---

## Implementation Checklist

### Phase 1: Database & Backend (COMPLETED)
- [x] Create migration file
- [x] Create API routes for team
- [x] Create API routes for tools
- [x] Create API routes for marketing
- [x] Create API routes for funding
- [x] Create API routes for activity feed
- [x] Create API routes for startup profile

### Phase 2: Core Components (COMPLETED)
- [x] AppLayout with sidebar
- [x] DashboardCard component
- [x] StatCard component
- [x] ActivityFeed component

### Phase 3: Pages (TODO)
- [ ] Update dashboard/page.tsx with new Overview layout
- [ ] Create /team/page.tsx
- [ ] Update /contacts/page.tsx with new features
- [ ] Create /tools/page.tsx
- [ ] Create /marketing/page.tsx
- [ ] Create /funding/page.tsx
- [ ] Create /communication/page.tsx
- [ ] Create portfolio modal component

### Phase 4: AI Integration (TODO)
- [ ] Create event listeners for database changes
- [ ] Build proactive message system for new modules
- [ ] Add AI triggers to each API endpoint
- [ ] Create module-specific AI agents

### Phase 5: Polish (TODO)
- [ ] Add drag-and-drop for dashboard cards
- [ ] Implement real-time updates
- [ ] Add charts and visualizations
- [ ] Mobile responsive design
- [ ] Animations and transitions

---

## Quick Start Instructions

1. **Run the migration**:
```bash
# Copy SQL from migrations/004_startup_os_features.sql
# Run in Supabase Dashboard SQL Editor
```

2. **Update your app to use AppLayout**:
```tsx
// In any page
import AppLayout from '@/components/AppLayout'

export default function Page() {
  return (
    <AppLayout user={user}>
      {/* Your page content */}
    </AppLayout>
  )
}
```

3. **Start building pages using the components**:
```tsx
import DashboardCard, { StatCard } from '@/components/DashboardCard'
import ActivityFeed from '@/components/ActivityFeed'

// Use in your pages
<StatCard label="Total Raised" value="$500K" icon="💰" />
<DashboardCard title="Recent Activity">
  <ActivityFeed limit={10} />
</DashboardCard>
```

4. **Connect AI agents**:
```typescript
// In any API route after data change
await fetch('/api/activity', {
  method: 'POST',
  body: JSON.stringify({
    activity_type: 'tool_connected',
    title: 'New tool added',
    metadata: { tool_id }
  })
})
```

---

## Next Steps

This migration provides the foundation. To complete it:

1. Build out the remaining pages following the patterns established
2. Add event listeners to trigger AI agents
3. Create visualizations (charts) for metrics
4. Implement real-time features using Supabase Realtime
5. Add drag-and-drop dashboard customization
6. Build mobile-responsive layouts

The architecture is now in place - you can build incrementally, one page at a time, while preserving all existing AI agent functionality.
