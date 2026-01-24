import type { AgentStep } from './ChatMessage';

import type { Confirmation } from './ChatMessage';

export interface AgentResponse {
  steps: AgentStep[];
  content: string;
  confirmations?: Confirmation[];
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
};

export function getAgentResponse(prompt: string): AgentResponse | null {
  const lowerPrompt = prompt.toLowerCase();
  
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
