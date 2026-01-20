import { BaseAgent } from './agent-framework'
import { AgentResponse, openai, DEFAULT_MODEL } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getConnectedIntegrations } from '@/lib/integrations/integration-monitor'

/**
 * Strategic Planning Agent
 * 
 * Analyzes the user's current state (Bird in Hand resources, progress, goals)
 * and generates actionable strategic roadmaps and recommendations.
 */
interface StrategicPlannerInput {
  goal?: string // Optional: specific goal to plan for, otherwise uses current_goal
  timeframe?: number // Weeks to plan for (default: 12)
  focus?: 'growth' | 'product' | 'fundraising' | 'team' | 'operations' | 'all'
}

interface StrategicPlannerOutput {
  currentState: {
    stage: string
    strengths: string[]
    gaps: string[]
    resources: {
      time: number
      budget: number
      network: number
      skills: string[]
    }
  }
  roadmap: Array<{
    week: number
    phase: string
    milestone: string
    tasks: string[]
    successMetrics: string[]
    blockers?: string[]
    dependencies?: string[]
  }>
  recommendations: {
    immediate: string[] // Next 1-2 weeks
    strategic: string[] // Long-term strategic moves
    quickWins: string[] // Easy wins to build momentum
  }
  risks: Array<{
    risk: string
    impact: 'high' | 'medium' | 'low'
    mitigation: string
  }>
}

export class StrategicPlannerAgent extends BaseAgent<StrategicPlannerInput, StrategicPlannerOutput> {
  id = 'strategic-planner'
  name = 'Strategic Planner'
  description = 'Analyzes your current state and creates actionable strategic roadmaps based on your Bird in Hand resources'
  category = 'Strategic'
  icon = '🎯'

  async execute(
    input: StrategicPlannerInput,
    userId: string
  ): Promise<AgentResponse<StrategicPlannerOutput>> {
    try {
      const context = await this.getUserContext(userId)
      const { profile, roadmapItems, contacts, documents } = context

      // Get connected integrations
      const connectedIntegrations = await getConnectedIntegrations(userId)
      const integrationList = Array.from(connectedIntegrations).join(', ') || 'None'

      // Get skills
      const supabase = await createServerSupabaseClient()
      const { data: skills } = await supabase
        .from('skills')
        .select('name, type, proficiency')
        .eq('user_id', userId)

      const goal = input.goal || profile.current_goal || 'Build and grow your startup'
      const timeframe = input.timeframe || 12

      // Analyze current state
      const currentState = this.analyzeCurrentState(profile, roadmapItems, contacts, skills || [])

      const systemPrompt = `Strategic advisor for startup founders. Generate concise strategic plan.

Building: ${profile.building_description || goal} | Goal: ${goal}
State: ${profile.stage || 'Early'} | Time: ${profile.hours_per_week || 0}h/wk | Budget: $${profile.funds_available || 0}
Network: ${contacts.length} | Skills: ${(skills || []).slice(0, 5).map((s: any) => s.name).join(', ') || 'None'}
Roadmap: ${roadmapItems.length} tasks (${roadmapItems.filter((r: any) => r.status === 'done').length} done, ${roadmapItems.filter((r: any) => r.status === 'in_progress').length} in progress)
Integrations: ${integrationList}

Principles: Bird in Hand (use existing resources) | Momentum (quick wins) | Focus (1-2 areas) | Realistic (time/budget)
CRITICAL: All tasks must directly advance "${profile.building_description || goal}"

Generate concise plan with: strengths, gaps, 8-week roadmap (max 4 milestones), quick wins, risks.`

      const userPrompt = `Create a ${timeframe}-week strategic roadmap for: "${goal}"

Focus Area: ${input.focus || 'all'}

Current State:
${JSON.stringify(currentState, null, 2)}

Generate a comprehensive strategic plan in JSON format:
{
  "currentState": {
    "stage": "Early stage / Product-market fit / Growth / etc.",
    "strengths": ["List 3-5 key strengths based on their resources"],
    "gaps": ["List 3-5 critical gaps that need addressing"],
    "resources": {
      "time": ${profile.hours_per_week || 0},
      "budget": ${profile.funds_available || 0},
      "network": ${contacts.length},
      "skills": ${JSON.stringify((skills || []).map((s: any) => s.name))}
    }
  },
  "roadmap": [
    {
      "week": 1,
      "phase": "Phase name (e.g., 'Validation', 'MVP Development', 'Launch')",
      "milestone": "Specific milestone to achieve",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "successMetrics": ["Metric 1", "Metric 2"],
      "blockers": ["Potential blocker if any"],
      "dependencies": ["What this depends on"]
    }
  ],
  "recommendations": {
    "immediate": ["What to do in next 1-2 weeks"],
    "strategic": ["Long-term strategic moves"],
    "quickWins": ["Easy wins to build momentum"]
  },
  "risks": [
    {
      "risk": "Risk description",
      "impact": "high|medium|low",
      "mitigation": "How to mitigate"
    }
  ]
}

Make it practical, actionable, and based on their actual resources.`

      const { content, tokensUsed } = await this.callOpenAI(
        systemPrompt,
        userPrompt,
        {
          model: DEFAULT_MODEL,
          temperature: 0.7,
          maxTokens: 1500, // Optimized: Strategic plans should be concise
          responseFormat: 'json'
        }
      )

      // Parse JSON response with error handling
      let plan: StrategicPlannerOutput
      try {
        // Remove any markdown code blocks if present
        const cleanContent = content
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim()
        
        plan = JSON.parse(cleanContent) as StrategicPlannerOutput
      } catch (parseError: any) {
        console.error('[StrategicPlanner] JSON parse error:', {
          error: parseError.message,
          content: content.substring(0, 500), // First 500 chars for debugging
          contentLength: content.length
        })
        throw new Error(`Failed to parse strategic plan JSON: ${parseError.message}. AI response may be malformed.`)
      }

      // Save roadmap items to database
      if (plan.roadmap && plan.roadmap.length > 0) {
        const roadmapToSave = plan.roadmap.slice(0, 8).map((item, index) => ({
          user_id: userId,
          title: item.milestone,
          description: `${item.phase} - Week ${item.week}\n\nTasks:\n${item.tasks.map(t => `- ${t}`).join('\n')}\n\nSuccess Metrics:\n${item.successMetrics.map(m => `- ${m}`).join('\n')}`,
          status: index === 0 ? 'in_progress' : 'todo',
          priority: Math.max(0, 8 - index),
          due_date: new Date(Date.now() + item.week * 7 * 24 * 60 * 60 * 1000).toISOString()
        }))

        // Only insert new items, don't duplicate
        for (const item of roadmapToSave) {
          const { data: existing } = await supabase
            .from('roadmap_items')
            .select('id')
            .eq('user_id', userId)
            .eq('title', item.title)
            .single()

          if (!existing) {
            await supabase.from('roadmap_items').insert(item)
          }
        }
      }

      return {
        success: true,
        data: plan,
        tokensUsed
      }
    } catch (error: any) {
      console.error('[StrategicPlanner] Error details:', {
        message: error.message,
        stack: error.stack,
        error: error
      })
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Failed to generate strategic plan'
      
      if (error.message?.includes('OpenAI API error')) {
        // Already formatted by BaseAgent
        errorMessage = error.message
      } else if (error.message?.includes('JSON')) {
        errorMessage = `Failed to parse strategic plan response: ${error.message}. The AI may have returned invalid JSON.`
      } else {
        errorMessage = `Strategic planning failed: ${errorMessage}`
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  private analyzeCurrentState(
    profile: any,
    roadmapItems: any[],
    contacts: any[],
    skills: any[]
  ): any {
    const completedTasks = roadmapItems.filter(item => item.status === 'done').length
    const totalTasks = roadmapItems.length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const inProgressTasks = roadmapItems.filter(item => item.status === 'in_progress')
    const blockedTasks = roadmapItems.filter(item => 
      item.status === 'in_progress' && 
      item.due_date && 
      new Date(item.due_date) < new Date()
    )

    return {
      goal: profile.current_goal || 'Not set',
      stage: profile.stage || 'Early stage',
      timeAvailable: profile.hours_per_week || 0,
      budget: profile.funds_available || 0,
      networkSize: contacts.length,
      skillsCount: skills.length,
      progress: {
        completionRate: Math.round(completionRate),
        completedTasks,
        totalTasks,
        inProgressTasks: inProgressTasks.length,
        blockedTasks: blockedTasks.length
      },
      resources: {
        hasBudget: (profile.funds_available || 0) > 0,
        hasTime: (profile.hours_per_week || 0) > 0,
        hasNetwork: contacts.length > 0,
        hasSkills: skills.length > 0
      }
    }
  }
}

// Register the agent
import { agentRegistry } from './agent-framework'
agentRegistry.register(new StrategicPlannerAgent())

