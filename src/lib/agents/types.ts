/**
 * Common types used across agents
 */

export interface EmailDraft {
  subject: string
  body: string
  to?: string
  cc?: string[]
  attachments?: string[]
}

export interface DocumentGeneration {
  title: string
  content: string
  format: 'markdown' | 'html' | 'text'
  sections: Array<{
    heading: string
    content: string
  }>
}

export interface AnalysisResult {
  summary: string
  insights: string[]
  recommendations: string[]
  data: Record<string, any>
}

export interface OutreachMessage {
  platform: 'email' | 'linkedin' | 'twitter'
  subject?: string
  message: string
  callToAction: string
}

export interface TaskGeneration {
  title: string
  description: string
  priority: number
  estimatedHours?: number
  dependencies?: string[]
}

export interface MetricsSummary {
  timeRemaining: {
    weeks: number
    days: number
  }
  budgetStatus: {
    spent: number
    remaining: number
    burnRate: number
  }
  teamSize: number
  activeContacts: number
  completedTasks: number
  totalTasks: number
}
