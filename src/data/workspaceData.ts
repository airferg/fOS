// Workspace mock data for agent monitoring

export type TaskStatus = 'running' | 'completed' | 'failed' | 'pending_approval' | 'queued';
export type StepStatus = 'completed' | 'running' | 'pending' | 'failed' | 'waiting_approval';

export interface AgentStep {
  id: string;
  name: string;
  status: StepStatus;
  tool?: string;
  data?: string;
  reasoning?: string;
  timestamp: string;
  duration?: string;
  result?: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  agentName: string;
  agentIcon: string;
  status: TaskStatus;
  startedAt: string;
  completedAt?: string;
  duration?: string;
  tokensUsed?: number;
  stepsCount: number;
  steps: AgentStep[];
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  lastRun?: string;
  runCount: number;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  agentName: string;
  action: string;
  description: string;
  preview?: {
    to?: string;
    subject?: string;
    body?: string;
  };
  createdAt: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface ProactiveRecommendation {
  id: string;
  title: string;
  description: string;
  agentId: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

// Mock Agents
export const agents: Agent[] = [
  { id: '1', name: 'Investor Readiness Score', category: 'Analysis', icon: 'target', description: 'Evaluates startup readiness for investor conversations', lastRun: '2 hours ago', runCount: 12 },
  { id: '2', name: 'Draft Investor Update', category: 'Communication', icon: 'mail', description: 'Generates monthly investor update emails', lastRun: '3 days ago', runCount: 8 },
  { id: '3', name: 'Cap Table Analyzer', category: 'Finance', icon: 'pie-chart', description: 'Analyzes equity distribution and dilution scenarios', lastRun: '1 week ago', runCount: 5 },
  { id: '4', name: 'Meeting Scheduler', category: 'Productivity', icon: 'calendar', description: 'Schedules meetings with contacts and investors', lastRun: '1 day ago', runCount: 23 },
  { id: '5', name: 'KPI Dashboard Generator', category: 'Analysis', icon: 'bar-chart', description: 'Creates visual KPI reports from your data', runCount: 0 },
  { id: '6', name: 'Pitch Deck Reviewer', category: 'Analysis', icon: 'presentation', description: 'Reviews and suggests improvements for pitch decks', lastRun: '5 days ago', runCount: 3 },
];

// Mock Tasks (recent execution history)
export const recentTasks: AgentTask[] = [
  {
    id: 'task-1',
    agentName: 'Investor Readiness Score',
    agentIcon: 'target',
    status: 'completed',
    startedAt: '2:34 PM',
    completedAt: '2:34 PM',
    duration: '3.2s',
    tokensUsed: 1247,
    stepsCount: 3,
    steps: [
      { id: 's1', name: 'Fetching startup data', status: 'completed', tool: 'Database queries', data: 'Team (3 members), Funding ($50K raised), Roadmap (12 tasks)', timestamp: '2:34:00 PM', duration: '0.8s' },
      { id: 's2', name: 'Analyzing investor readiness', status: 'completed', tool: 'OpenAI GPT-4', reasoning: 'Evaluating across 5 categories: team completeness, market size, product progress, traction metrics, fundability', timestamp: '2:34:01 PM', duration: '2.1s' },
      { id: 's3', name: 'Score calculated', status: 'completed', timestamp: '2:34:03 PM', duration: '0.3s', result: { totalScore: 72, team: 16, market: 14, product: 18, traction: 12, fundability: 12 } },
    ],
    output: {
      totalScore: 72,
      subscores: { team: '16/20', market: '14/20', product: '18/20', traction: '12/20', fundability: '12/20' },
      strengths: ['Strong technical team', 'Clear product roadmap'],
      concerns: ['Limited traction data', 'No lead investor yet'],
      nextSteps: ['Connect with 3 VCs', 'Prepare pitch deck', 'Gather customer testimonials'],
    },
  },
  {
    id: 'task-2',
    agentName: 'Draft Investor Update',
    agentIcon: 'mail',
    status: 'pending_approval',
    startedAt: '1:15 PM',
    stepsCount: 4,
    steps: [
      { id: 's1', name: 'Fetching recent metrics', status: 'completed', tool: 'Database queries', timestamp: '1:15:00 PM', duration: '0.5s' },
      { id: 's2', name: 'Generating update draft', status: 'completed', tool: 'OpenAI GPT-4', timestamp: '1:15:01 PM', duration: '3.2s' },
      { id: 's3', name: 'Preparing email', status: 'completed', tool: 'Gmail API', timestamp: '1:15:04 PM', duration: '0.3s' },
      { id: 's4', name: 'Awaiting approval to send', status: 'waiting_approval', timestamp: '1:15:04 PM' },
    ],
  },
  {
    id: 'task-3',
    agentName: 'Meeting Scheduler',
    agentIcon: 'calendar',
    status: 'failed',
    startedAt: '11:30 AM',
    duration: '1.8s',
    stepsCount: 2,
    steps: [
      { id: 's1', name: 'Checking calendar availability', status: 'completed', tool: 'Google Calendar API', timestamp: '11:30:00 AM', duration: '0.6s' },
      { id: 's2', name: 'Sending calendar invite', status: 'failed', tool: 'Google Calendar API', reasoning: 'API rate limit exceeded - sent 100 requests in last hour', timestamp: '11:30:01 AM', duration: '1.2s' },
    ],
  },
  {
    id: 'task-4',
    agentName: 'Cap Table Analyzer',
    agentIcon: 'pie-chart',
    status: 'completed',
    startedAt: '10:00 AM',
    completedAt: '10:00 AM',
    duration: '2.1s',
    tokensUsed: 856,
    stepsCount: 2,
    steps: [
      { id: 's1', name: 'Loading cap table data', status: 'completed', tool: 'Database queries', timestamp: '10:00:00 AM', duration: '0.4s' },
      { id: 's2', name: 'Calculating dilution scenarios', status: 'completed', tool: 'Internal calculations', timestamp: '10:00:00 AM', duration: '1.7s' },
    ],
  },
  {
    id: 'task-5',
    agentName: 'Investor Readiness Score',
    agentIcon: 'target',
    status: 'running',
    startedAt: 'Just now',
    stepsCount: 3,
    steps: [
      { id: 's1', name: 'Fetching startup data', status: 'completed', tool: 'Database queries', timestamp: 'Just now', duration: '0.8s' },
      { id: 's2', name: 'Analyzing investor readiness', status: 'running', tool: 'OpenAI GPT-4', timestamp: 'Just now' },
      { id: 's3', name: 'Score calculation', status: 'pending', timestamp: '' },
    ],
  },
];

// Mock Approval Requests
export const pendingApprovals: ApprovalRequest[] = [
  {
    id: 'approval-1',
    taskId: 'task-2',
    agentName: 'Draft Investor Update',
    action: 'Send Email',
    description: 'Send monthly investor update to all investors',
    preview: {
      to: 'jordan@sequoia.com, sarah@a16z.com, +3 more',
      subject: 'January 2026 Investor Update - NewFoundOS',
      body: 'Dear Investors,\n\nHappy New Year! Here\'s our January update:\n\n📈 MRR: $47K (+23% MoM)\n👥 Team: 8 members\n🚀 Key Wins: Shipped API v2, 40% faster response times\n\nBest,\nKean & McCoy',
    },
    createdAt: '1:15 PM',
    urgency: 'medium',
  },
];

// Mock Proactive Recommendations
export const proactiveRecommendations: ProactiveRecommendation[] = [
  {
    id: 'rec-1',
    title: 'Draft investor update email',
    description: "You haven't updated investors in 2 weeks",
    agentId: '2',
    priority: 'high',
    createdAt: '10 minutes ago',
  },
  {
    id: 'rec-2',
    title: 'Review cap table before fundraise',
    description: 'Funding round detected - verify equity splits',
    agentId: '3',
    priority: 'medium',
    createdAt: '1 hour ago',
  },
];
