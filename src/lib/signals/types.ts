/**
 * Hydra Signals – types for operating state and generated signals.
 */

export type SignalCategory = 'Execution' | 'Team' | 'Product' | 'Funding' | 'GTM'
export type SignalSeverity = 'Low' | 'Medium' | 'High'

export interface Milestone {
  id: string
  name: string
  dueDate: string
  status: string
  ownerId: string
}

export interface RoadmapItem {
  id: string
  title: string
  status: string
  ownerId: string
  updatedAt: string
}

export interface ProductState {
  milestones: Milestone[]
  roadmapItems: RoadmapItem[]
}

export interface Campaign {
  id: string
  name: string
  status: string
  lastActivityAt: string
}

export interface GTMState {
  leadsThisWeek: number
  leadsLastWeek: number
  campaigns: Campaign[]
}

export interface TeamMemberWorkload {
  id: string
  name: string
  workloadScore: number
}

export interface TeamState {
  members: TeamMemberWorkload[]
  unassignedCount: number
}

export interface InvestorFollowup {
  id: string
  investor: string
  dueDate: string
  status: string
}

export interface FundingState {
  runwayMonths: number
  runwayLastMonth: number
  investorFollowups: InvestorFollowup[]
}

export interface ExecutionState {
  overdueTasks: number
  velocityThisWeek: number
  velocityLastWeek: number
}

export interface OperatingState {
  timestamp: string
  product: ProductState
  gtm: GTMState
  team: TeamState
  funding: FundingState
  execution: ExecutionState
}

export interface Signal {
  id: string
  /** Short code for list view (e.g. SIG-1) */
  shortId: string
  category: SignalCategory
  /** Detected change + action, e.g. "Runway dropped 2 months. Update investor deck?" */
  title: string
  evidence: string
  recommendation: string
  /** Action CTA, e.g. "Respond?", "Notify #product?" */
  ctaLabel: string
  ctaHref: string
  severity: SignalSeverity
  createdAt: string
  fingerprint: string
}
