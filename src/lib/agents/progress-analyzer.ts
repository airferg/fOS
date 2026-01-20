import { BaseAgent } from './agent-framework'
import { AgentResponse, openai, DEFAULT_MODEL } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Progress Analyzer Agent
 * 
 * Analyzes user's progress, identifies blockers, suggests pivots,
 * and provides insights on what's working and what's not.
 */
interface ProgressAnalyzerInput {
  timeframe?: 'week' | 'month' | 'quarter' | 'all' // Time period to analyze
  focus?: 'roadmap' | 'goals' | 'resources' | 'all'
}

interface ProgressAnalyzerOutput {
  progress: {
    overall: number // 0-100
    byCategory: Record<string, number>
    trend: 'improving' | 'stable' | 'declining'
  }
  insights: {
    whatWorking: string[]
    whatNotWorking: string[]
    momentum: 'high' | 'medium' | 'low'
  }
  blockers: Array<{
    blocker: string
    impact: 'high' | 'medium' | 'low'
    suggestion: string
  }>
  opportunities: Array<{
    opportunity: string
    potential: 'high' | 'medium' | 'low'
    action: string
  }>
  recommendations: {
    immediate: string[]
    strategic: string[]
    pivot?: string // If pivot is recommended
  }
}

export class ProgressAnalyzerAgent extends BaseAgent<ProgressAnalyzerInput, ProgressAnalyzerOutput> {
  id = 'progress-analyzer'
  name = 'Progress Analyzer'
  description = 'Analyzes your progress, identifies blockers, and suggests improvements'
  category = 'Strategic'
  icon = '📊'

  async execute(
    input: ProgressAnalyzerInput,
    userId: string
  ): Promise<AgentResponse<ProgressAnalyzerOutput>> {
    try {
      const context = await this.getUserContext(userId)
      const { profile, roadmapItems, contacts, documents } = context

      // Get agent tasks to analyze execution patterns
      const supabase = await createServerSupabaseClient()
      const { data: agentTasks } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      // Calculate progress metrics
      const progressMetrics = this.calculateProgress(roadmapItems, agentTasks || [])

      const systemPrompt = `You are a startup progress analyst. Your role is to:

1. ANALYZE progress objectively
2. IDENTIFY what's working and what's not
3. SPOT blockers and bottlenecks
4. SUGGEST improvements and pivots
5. PROVIDE actionable recommendations

CURRENT STATE:
- Goal: ${profile.current_goal || 'Not set'}
- Stage: ${profile.stage || 'Early stage'}
- Time: ${profile.hours_per_week || 0} hours/week
- Budget: $${profile.funds_available || 0}
- Network: ${contacts.length} contacts

PROGRESS METRICS:
${JSON.stringify(progressMetrics, null, 2)}

ROADMAP STATUS:
- Total Tasks: ${roadmapItems.length}
- Completed: ${roadmapItems.filter(r => r.status === 'done').length}
- In Progress: ${roadmapItems.filter(r => r.status === 'in_progress').length}
- To Do: ${roadmapItems.filter(r => r.status === 'todo').length}
- Overdue: ${roadmapItems.filter(r => r.status === 'in_progress' && r.due_date && new Date(r.due_date) < new Date()).length}

RECENT ACTIVITY:
- Agent Tasks Completed: ${(agentTasks || []).filter(t => t.status === 'completed').length}
- Agent Tasks Failed: ${(agentTasks || []).filter(t => t.status === 'failed').length}
- Documents Created: ${documents.length}

Analyze this data and provide:
1. Honest assessment of progress
2. What's working well
3. What's not working
4. Blockers preventing progress
5. Opportunities to accelerate
6. Recommendations for improvement or pivots`

      const userPrompt = `Analyze progress for the ${input.timeframe || 'all'} timeframe.

Focus: ${input.focus || 'all'}

Provide analysis in JSON format:
{
  "progress": {
    "overall": 0-100,
    "byCategory": {
      "product": 0-100,
      "growth": 0-100,
      "fundraising": 0-100
    },
    "trend": "improving|stable|declining"
  },
  "insights": {
    "whatWorking": ["What's going well"],
    "whatNotWorking": ["What's not working"],
    "momentum": "high|medium|low"
  },
  "blockers": [
    {
      "blocker": "What's blocking progress",
      "impact": "high|medium|low",
      "suggestion": "How to overcome"
    }
  ],
  "opportunities": [
    {
      "opportunity": "Opportunity description",
      "potential": "high|medium|low",
      "action": "What to do"
    }
  ],
  "recommendations": {
    "immediate": ["Next steps"],
    "strategic": ["Long-term moves"],
    "pivot": "Optional: pivot suggestion if needed"
  }
}

Be honest, actionable, and specific.`

      const { content, tokensUsed } = await this.callOpenAI(
        systemPrompt,
        userPrompt,
        {
          model: DEFAULT_MODEL,
          temperature: 0.7,
          maxTokens: 1000, // Optimized: Progress analysis should be concise
          responseFormat: 'json'
        }
      )

      const analysis = JSON.parse(content) as ProgressAnalyzerOutput

      return {
        success: true,
        data: analysis,
        tokensUsed
      }
    } catch (error: any) {
      console.error('[ProgressAnalyzer] Error:', error)
      return {
        success: false,
        error: error.message || 'Failed to analyze progress'
      }
    }
  }

  private calculateProgress(roadmapItems: any[], agentTasks: any[]): any {
    const totalTasks = roadmapItems.length
    const completedTasks = roadmapItems.filter(r => r.status === 'done').length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const inProgressTasks = roadmapItems.filter(r => r.status === 'in_progress')
    const overdueTasks = roadmapItems.filter(r => 
      r.status === 'in_progress' && 
      r.due_date && 
      new Date(r.due_date) < new Date()
    )

    const recentCompletions = roadmapItems.filter(r => 
      r.status === 'done' && 
      r.updated_at &&
      new Date(r.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    const agentSuccessRate = agentTasks.length > 0
      ? (agentTasks.filter(t => t.status === 'completed').length / agentTasks.length) * 100
      : 0

    return {
      completionRate: Math.round(completionRate),
      totalTasks,
      completedTasks,
      inProgressTasks: inProgressTasks.length,
      overdueTasks: overdueTasks.length,
      recentCompletions: recentCompletions.length,
      agentSuccessRate: Math.round(agentSuccessRate),
      velocity: recentCompletions.length // Tasks completed in last week
    }
  }
}

// Register the agent
import { agentRegistry } from './agent-framework'
agentRegistry.register(new ProgressAnalyzerAgent())

