import type { AgentStep } from './ChatMessage';

import type { Confirmation } from './ChatMessage';

export interface AgentResponse {
  steps: AgentStep[];
  content: string;
  confirmations?: Confirmation[];
  /** Step delay in ms (for signal workflows; default 600). Min 8s total → use 1000 with 8 steps. */
  stepDelayMs?: number;
}

// Simulated agent responses for the three prompts - NO EMOJIS, using symbols instead
export const agentResponses: Record<string, AgentResponse> = {
  'user-interviews': {
    steps: [
      { id: '1', title: 'Fetching user interview notes from', source: 'Notion', subtitle: 'last 7 days', status: 'completed' },
      { id: '2', title: 'Analyzing feedback themes from', source: 'Interview transcripts', subtitle: '5 interviews processed', status: 'completed' },
      { id: '3', title: 'Cross-referencing with', source: 'Product Roadmap', subtitle: 'Q1 priorities', status: 'completed' },
      { id: '4', title: 'Identifying impact on current sprint', source: '', subtitle: 'roadmap adjustments', status: 'completed' },
      { id: '5', title: 'Summary generated', source: '', subtitle: 'insights ready', status: 'completed' },
    ],
    content: `**This Week's User Interview Summary**

**Current Status:** 5 interviews conducted | Early adopters and beta users

**Key Themes Identified:**

1. **Onboarding Friction** (mentioned by 4/5 users)
   - Users want a quicker path to value
   - Recommendation: Add "quick start" template option

2. **Dashboard Customization** (mentioned by 3/5 users)
   - Users want to rearrange widgets
   - Already on Q1 roadmap - consider prioritizing

3. **Mobile Experience** (mentioned by 3/5 users)
   - Requests for better mobile responsiveness
   - Not currently on roadmap - suggest adding to Q2

**Roadmap Impact:**
- High Priority: Move "Quick Start Templates" to current sprint
- Medium: Dashboard customization aligns with roadmap
- Future: Mobile improvements for Q2 consideration

**Recommended Actions:**

1. **Schedule design review** for onboarding flow
   - Owner: Product team
   - Due: End of week

2. **Share findings with engineering** by Friday
   - Format: Async Loom recording
   - Include user quotes

3. **Update roadmap priorities** in next planning session
   - Propose sprint scope change
   - Prepare trade-off analysis`,
  },
  
  'funding-investor': {
    steps: [
      { id: '1', title: 'Analyzing current runway from', source: 'Financial data', subtitle: '8 months remaining', status: 'completed' },
      { id: '2', title: 'Reviewing investor pipeline from', source: 'CRM contacts', subtitle: '12 active leads', status: 'completed' },
      { id: '3', title: 'Checking recent communications', source: '', subtitle: 'email threads', status: 'completed' },
      { id: '4', title: 'Evaluating investor fit scores', source: '', subtitle: 'based on thesis match', status: 'completed' },
      { id: '5', title: 'Prioritization complete', source: '', subtitle: 'action plan ready', status: 'completed' },
    ],
    content: `**Funding & Investor Outreach Priorities**

**Current Status:** 8 months runway | $50K raised | Targeting $1.5M Seed

**Immediate Actions (This Week):**

1. **Follow up with Sarah Chen @ Sequoia**
   - Last contact: 2 weeks ago
   - Status: Showed interest in metrics update
   - Action: Send updated MRR dashboard

2. **Schedule intro with Marcus Johnson @ a16z**
   - Warm intro available through Alex (YC contact)
   - Thesis match: 92%
   - Action: Request intro by Wednesday

3. **Prepare data room updates**
   - Cap table needs refresh
   - Add Q4 financial projections
   - Update team slide with new hire

**Pipeline Prioritization:**

| Investor | Stage | Fit Score | Next Step |
|----------|-------|-----------|-----------|
| Sequoia (Sarah) | Follow-up | 94% | Send metrics |
| a16z (Marcus) | Intro needed | 92% | Request warm intro |
| Index (Priya) | Cold | 88% | Research first |
| Founders Fund | Cold | 85% | Wait for traction |

**This Week's Goals:**
- [ ] 2 investor meetings scheduled
- [ ] Data room fully updated
- [ ] Pitch deck v3 finalized`,
  },
  
  'legal-tasks': {
    steps: [
      { id: '1', title: 'Scanning incorporation documents', source: '', subtitle: 'Delaware C-Corp status', status: 'completed' },
      { id: '2', title: 'Checking compliance deadlines', source: 'Legal calendar', subtitle: 'upcoming filings', status: 'completed' },
      { id: '3', title: 'Reviewing equity agreements', source: '', subtitle: 'vesting schedules', status: 'completed' },
      { id: '4', title: 'Identifying regulatory requirements', source: '', subtitle: 'stage-specific', status: 'completed' },
      { id: '5', title: 'Urgent tasks identified', source: '', subtitle: '3 action items', status: 'completed' },
    ],
    content: `**Urgent Legal Tasks for Pre-Seed Stage**

**3 Items Requiring Immediate Attention**

- URGENT (This Week):

1. **83(b) Election Filing - Deadline Approaching**
   - For: New co-founder equity grant
   - Deadline: 30 days from grant (Feb 15th)
   - Impact: Could save significant taxes
   - Action: File with IRS immediately

2. **Delaware Franchise Tax Due**
   - Due: March 1st
   - Estimated: $400 (minimum for startups)
   - Action: Calendar reminder set, payment pending

- IMPORTANT (This Month):

3. **Update Employee Agreements**
   - Issue: IP assignment clauses need strengthening
   - Affects: 2 contractors converting to FT
   - Action: Have counsel review updated template

**Compliance Checklist:**
- [x] 409A valuation (completed 6 months ago)
- [x] Board consent for option grants
- [ ] IP assignment agreements (needs update)
- [x] Privacy policy (GDPR compliant)
- [ ] Terms of service (review recommended)

**Recommended Legal Counsel Actions:**

1. **Send 83(b) election to tax attorney** today
   - Priority: Critical
   - Consequence of delay: Tax liability

2. **Schedule 30-min review** of IP assignments
   - With: Corporate counsel
   - Timeline: This week

3. **Add franchise tax** to recurring calendar
   - Frequency: Annual
   - Next due: March 1st

**Estimated Legal Costs This Quarter:** $2,500-4,000`,
  },
  
  'slack-zoom-action': {
    steps: [
      { id: '1', title: 'Sending report to', source: 'Slack', subtitle: '#legal channel', status: 'completed' },
      { id: '2', title: 'Scheduling meeting in', source: 'Zoom', subtitle: '1 week from now', status: 'completed' },
      { id: '3', title: 'Confirmations sent', source: '', subtitle: 'all actions complete', status: 'completed' },
    ],
    content: `**Actions Completed**

Your legal tasks report has been shared and a meeting has been scheduled.`,
    confirmations: [
      {
        type: 'slack',
        channel: '#legal',
        message: 'Legal tasks report sent successfully',
      },
      {
        type: 'zoom',
        title: 'Legal Tasks Discussion',
        date: 'January 30, 2026',
        time: '11:30 AM',
        duration: '30 minutes',
        meetingId: 'zoom.us/j/123456789',
      },
    ],
  },

  // Signal-triggered workflows (SIG-1, SIG-4, SIG-8) – min 8s with 8 steps
  'signal-sig-1': {
    steps: [
      { id: '1', title: 'Pulling runway data from', source: 'Financial model', subtitle: '11 → 8 months', status: 'completed' },
      { id: '2', title: 'Checking investor deck version in', source: 'Drive', subtitle: 'last updated 2 weeks ago', status: 'completed' },
      { id: '3', title: 'Comparing metrics to', source: 'CRM', subtitle: 'pipeline and milestones', status: 'completed' },
      { id: '4', title: 'Updating burn and runway slide', source: '', subtitle: 'charts and projections', status: 'completed' },
      { id: '5', title: 'Refreshing team and traction slides', source: '', subtitle: 'current headcount and MRR', status: 'completed' },
      { id: '6', title: 'Running consistency check', source: '', subtitle: 'deck vs data room', status: 'completed' },
      { id: '7', title: 'Generating summary of changes', source: '', subtitle: 'slide-by-slide notes', status: 'completed' },
      { id: '8', title: 'Investor deck update ready', source: '', subtitle: 'ready to share', status: 'completed' },
    ],
    content: `**Investor Deck Update (Runway 11 → 8 months)**

**Summary of changes**

- **Slide 3 – Runway & burn:** Updated to 8 months runway; added note on planned cost adjustments.
- **Slide 5 – Use of funds:** Reprioritized to extend runway; hiring timeline shifted by 2 months.
- **Slide 7 – Milestones:** Dates aligned with current product roadmap.

**Completed**

- [x] Review the deck in Drive (v3-draft) and approve or edit.
- [x] Share with Acme Ventures before your follow-up on 2026-02-07.
- [x] Add a short "runway update" to your monthly investor email.`,
    stepDelayMs: 1000,
  },

  'signal-sig-4': {
    steps: [
      { id: '1', title: 'Fetching milestone from', source: 'Product roadmap', subtitle: 'Beta launch – In Progress', status: 'completed' },
      { id: '2', title: 'Checking due date and blockers in', source: 'JIRA', subtitle: 'due 2026-01-29', status: 'completed' },
      { id: '3', title: 'Pulling recent activity from', source: '#product', subtitle: 'last 7 days', status: 'completed' },
      { id: '4', title: 'Drafting status summary', source: '', subtitle: 'scope and new ETA', status: 'completed' },
      { id: '5', title: 'Preparing message for', source: 'Slack', subtitle: '#product channel', status: 'completed' },
      { id: '6', title: 'Adding suggested next steps', source: '', subtitle: 'reschedule or reprioritize', status: 'completed' },
      { id: '7', title: 'Formatting for', source: 'Slack', subtitle: 'thread-ready', status: 'completed' },
      { id: '8', title: 'Notify #product ready', source: '', subtitle: 'review and send', status: 'completed' },
    ],
    content: `**Milestone overdue: Beta launch – Notify #product**

**Draft for #product**

> **Beta launch (due 2026-01-29)** – still in progress.
> - Blockers: [integration QA]; ETA now Feb 15.
> - Next: Reschedule milestone in JIRA and confirm with eng.

**Completed**

- [x] Post this to #product (or edit and post) so the team is aligned.
- [x] Update the milestone in JIRA to new due date and add a short comment.
- [x] Sync with eng lead on capacity if the slip continues.`,
    stepDelayMs: 1000,
  },

  'signal-sig-8': {
    steps: [
      { id: '1', title: 'Looking up follow-up in', source: 'CRM', subtitle: 'Acme Ventures', status: 'completed' },
      { id: '2', title: 'Checking last contact from', source: 'Email', subtitle: '2 weeks ago', status: 'completed' },
      { id: '3', title: 'Pulling metrics from', source: 'Dashboard', subtitle: 'MRR and usage', status: 'completed' },
      { id: '4', title: 'Drafting short update', source: '', subtitle: '2–3 paragraphs', status: 'completed' },
      { id: '5', title: 'Adding key numbers and link to', source: 'Deck', subtitle: 'investor deck v3', status: 'completed' },
      { id: '6', title: 'Checking calendar for', source: '', subtitle: 'next meeting slot', status: 'completed' },
      { id: '7', title: 'Finalizing draft', source: '', subtitle: 'ready to send', status: 'completed' },
      { id: '8', title: 'Follow-up draft ready', source: '', subtitle: 'due 2026-02-07', status: 'completed' },
    ],
    content: `**Follow-up with Acme Ventures (due 2026-02-07)**

**Draft update (copy and send)**

---

Hi [Contact],

Quick update ahead of our follow-up:

- **Runway:** Now at 8 months; we've tightened burn and updated the plan in the deck.
- **Product:** Beta launch shifted to mid-Feb; we'll share release notes when it's live.
- **Traction:** [Add 1–2 metrics if you have them.]

I've attached the latest deck. Happy to find 15–30 min next week if you'd like to walk through it.

Best,
[Your name]

---

**Completed**

- [x] Paste into email and personalize.
- [x] Attach the updated investor deck (v3).
- [x] Send by 2026-02-07 and log in CRM.`,
    stepDelayMs: 1000,
  },
};

/** Trigger string for signal workflows; run=SIG-1 etc. in URL. */
export const SIGNAL_WORKFLOW_IDS = ['SIG-1', 'SIG-4', 'SIG-8'] as const;

export function getSignalWorkflowTrigger(shortId: string): string | null {
  if (SIGNAL_WORKFLOW_IDS.includes(shortId as (typeof SIGNAL_WORKFLOW_IDS)[number])) {
    return `__signal_${shortId.toLowerCase().replace('-', '_')}__`;
  }
  return null;
}

export function getAgentResponse(prompt: string): AgentResponse | null {
  const lowerPrompt = prompt.toLowerCase();

  // Signal workflow triggers (from run=SIG-1 etc. in URL)
  if (lowerPrompt.includes('__signal_sig_1__')) return agentResponses['signal-sig-1'];
  if (lowerPrompt.includes('__signal_sig_4__')) return agentResponses['signal-sig-4'];
  if (lowerPrompt.includes('__signal_sig_8__')) return agentResponses['signal-sig-8'];

  if ((lowerPrompt.includes('send this to #legal') ||
      (lowerPrompt.includes('send') && prompt.includes('#legal') && (lowerPrompt.includes('zoom') || prompt.includes('@zoom'))) ||
      (lowerPrompt.includes('send this to') && lowerPrompt.includes('legal') && lowerPrompt.includes('zoom')))) {
    return agentResponses['slack-zoom-action'];
  }

  if (lowerPrompt.includes('interview') || lowerPrompt.includes('roadmap impact') || lowerPrompt.includes('user interviews')) {
    return agentResponses['user-interviews'];
  }

  if (lowerPrompt.includes('funding') || lowerPrompt.includes('investor') || lowerPrompt.includes('outreach')) {
    return agentResponses['funding-investor'];
  }

  if (lowerPrompt.includes('legal') || lowerPrompt.includes('urgent legal')) {
    return agentResponses['legal-tasks'];
  }

  return null;
}

export const defaultSuggestions = [
  { id: '1', text: "Summarize this week's user interviews and roadmap impact." },
  { id: '2', text: "Prioritize my next funding and investor outreach steps." },
  { id: '3', text: "List my urgent legal tasks for this stage." },
];
