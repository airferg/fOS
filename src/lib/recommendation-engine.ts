import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getConnectedIntegrations } from '@/lib/integrations/integration-monitor'
import { openai, DEFAULT_MODEL } from '@/lib/openai'

/**
 * Recommendation Engine
 * 
 * Analyzes user's current state and generates personalized recommendations
 * based on Bird in Hand principle - using what they have NOW.
 */
export interface Recommendation {
  id: string
  type: 'task' | 'strategic' | 'quick-win' | 'integration' | 'network'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  functionContext?: 'product' | 'marketing' | 'finance' | 'operations' | 'legal' | 'sales' | 'team' | 'analytics' // Business function context
  action?: {
    type: string
    title: string
    data: any
  }
  reasoning: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  timeframe: string
  canDoAgentically: boolean // Can AI execute this, or does user need to do it?
  agenticDescription?: string // How AI will handle it if agentic
  manualDescription?: string // What user needs to do if manual
}

export async function generateRecommendations(userId: string): Promise<Recommendation[]> {
  try {
    const supabase = await createServerSupabaseClient()

    // Get user context
    const [
      { data: profile },
      { data: roadmapItems },
      { data: contacts },
      { data: documents },
      { data: skills },
      { data: ideas }
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('roadmap_items').select('*').eq('user_id', userId),
      supabase.from('contacts').select('*').eq('user_id', userId),
      supabase.from('documents').select('*').eq('user_id', userId),
      supabase.from('skills').select('*').eq('user_id', userId),
      supabase.from('ideas').select('*').eq('user_id', userId)
    ])

    // Get connected integrations
    const connectedIntegrations = await getConnectedIntegrations(userId)
    const integrationList = Array.from(connectedIntegrations).join(', ') || 'None'

    // Get recent agent tasks
    const { data: recentTasks } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate progress
    const completedTasks = roadmapItems?.filter(r => r.status === 'done').length || 0
    const totalTasks = roadmapItems?.length || 0
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    
    // Get existing roadmap task titles to avoid duplicate recommendations
    const existingTaskTitles = (roadmapItems || []).map(r => r.title?.toLowerCase().trim()).filter(Boolean)

    // Function detection utility
    const detectFunction = (title: string, description: string): Recommendation['functionContext'] | undefined => {
      const text = `${title} ${description}`.toLowerCase()
      
      // Product-related keywords
      if (text.match(/\b(product|feature|prd|spec|roadmap|user research|user feedback|mvp|prototype|design|ui|ux|development|engineering|code|technical|backend|frontend|api|database)\b/)) {
        return 'product'
      }
      
      // Marketing-related keywords
      if (text.match(/\b(marketing|campaign|social media|instagram|twitter|x|linkedin|content|blog|seo|advertising|ads|brand|outreach|growth|acquisition|conversion|email marketing|newsletter)\b/)) {
        return 'marketing'
      }
      
      // Finance-related keywords
      if (text.match(/\b(finance|financial|funding|fundraise|investor|stripe|payment|billing|revenue|pricing|cost|budget|runway|accounting|bookkeeping|quickbooks|payroll|invoice|expense)\b/)) {
        return 'finance'
      }
      
      // Sales-related keywords
      if (text.match(/\b(sales|revenue|customer|client|pipeline|leads|prospect|deal|closing|demand|salesforce|crm|outreach|cold|cold email)\b/)) {
        return 'sales'
      }
      
      // Operations-related keywords
      if (text.match(/\b(operations|ops|process|workflow|automation|team|hiring|onboarding|hr|culture|meeting|calendar|schedule|tools|system|infrastructure)\b/)) {
        return 'operations'
      }
      
      // Legal-related keywords
      if (text.match(/\b(legal|law|contract|agreement|terms|privacy|policy|compliance|incorporate|llc|corp|copyright|trademark|patent|nda)\b/)) {
        return 'legal'
      }
      
      // Analytics-related keywords
      if (text.match(/\b(analytics|metrics|data|insights|dashboard|tracking|mixpanel|amplitude|google analytics|report|kpi|measurement|performance)\b/)) {
        return 'analytics'
      }
      
      // Team-related keywords
      if (text.match(/\b(team|hire|recruit|employee|contractor|collaboration|slack|discord|communication|standup|meeting)\b/)) {
        return 'team'
      }
      
      return undefined
    }

    const systemPrompt = `Startup advisor - generate 5-8 concise recommendations using Bird in Hand principle.

Building: ${profile?.building_description || profile?.current_goal || 'startup'} | Goal: ${profile?.current_goal || 'None'}
State: ${profile?.stage || 'Early'} | Time: ${profile?.hours_per_week || 0}h/wk | Budget: $${profile?.funds_available || 0}
Network: ${contacts?.length || 0} | Skills: ${(skills || []).slice(0, 5).map((s: any) => s.name).join(', ') || 'None'}
Progress: ${completionRate.toFixed(0)}% (${completedTasks}/${totalTasks} tasks) | Integrations: ${integrationList}

EXISTING TASKS (DO NOT SUGGEST): ${roadmapItems?.slice(0, 5).map((r: any) => r.title).join(', ') || 'None'}

Rules:
- Each recommendation must directly advance their build
- Use existing resources only (Bird in Hand)
- Mix quick wins + strategic moves
- Only suggest agentic tasks if integrations are connected
- Title: 3-5 words max | Description: 1 sentence, 20-30 words max

Return JSON with this structure:
{
  "recommendations": [
    {
      "type": "task|strategic|quick-win|integration|network",
      "priority": "high|medium|low",
      "title": "Very short, actionable title (3-5 words max)",
      "description": "1 sentence, 20-30 words max",
      "functionContext": "product|marketing|finance|operations|legal|sales|team|analytics",
      "reasoning": "Why this matters now",
      "impact": "Expected impact",
      "effort": "low|medium|high",
      "timeframe": "When (e.g., 'This week')",
      "canDoAgentically": true,
      "agenticDescription": "If true: 'I can handle this, just say the word'",
      "manualDescription": "If false: what user needs to do",
      "action": { "type": "agent_id", "title": "Action", "data": { "agentId": "task-executor", "input": { "task": "Specific task description for the dynamic agent to execute" } } }
    }
  ]
}

CRITICAL AGENT SELECTION:
- ALWAYS use "task-executor" for all recommendations (this is the dynamic agent that can handle any task)
- The task-executor agent dynamically selects and uses tools based on the task at hand
- Only use specialized agents (like draft-investor-email) if the recommendation explicitly calls for that specific agent
- For 99% of recommendations, use task-executor - it's designed to handle any task dynamically

CRITICAL: For each recommendation, assign a functionContext based on the task:
- product: Product development, features, design, engineering
- marketing: Marketing campaigns, social media, content, growth
- finance: Funding, payments, billing, accounting, runway
- sales: Sales pipeline, customer acquisition, revenue
- operations: Team, hiring, processes, workflows, automation
- legal: Contracts, compliance, incorporation, policies
- team: Hiring, team management, collaboration
- analytics: Metrics, data, insights, tracking
If unclear, omit functionContext field.`

    const userPrompt = `Generate 5-8 recommendations: quick wins + strategic moves. Focus: blockers, network leverage, maximize progress with current resources.`

           let completion
           try {
             completion = await openai.chat.completions.create({
               model: DEFAULT_MODEL,
               messages: [
                 { role: 'system', content: systemPrompt },
                 { role: 'user', content: userPrompt }
               ],
               temperature: 0.7,
               max_tokens: 800, // Optimized: Recommendations should be brief
               response_format: { type: 'json_object' }
             })
           } catch (error: any) {
             // Handle quota/rate limit errors gracefully
             if (error.code === 'insufficient_quota' || error.status === 429) {
               console.error('[RecommendationEngine] OpenAI quota exceeded, returning empty recommendations')
               return [] // Return empty array instead of crashing
             }
             throw error // Re-throw other errors
           }

    const content = completion.choices[0]?.message?.content || '{}'
    
    let response: any = {}
    try {
      response = JSON.parse(content)
    } catch (parseError: any) {
      console.error('[RecommendationEngine] JSON parse error:', parseError.message)
      console.error('[RecommendationEngine] Content:', content.substring(0, 500))
      return []
    }
    
    // Handle different response structures
    let recommendationsArray: any[] = []
    if (Array.isArray(response)) {
      recommendationsArray = response
    } else if (response.recommendations && Array.isArray(response.recommendations)) {
      recommendationsArray = response.recommendations
    } else if (response.data && Array.isArray(response.data)) {
      recommendationsArray = response.data
    } else {
      console.warn('[RecommendationEngine] Unexpected response structure:', response)
      return []
    }
    
    let recommendations = recommendationsArray.map((rec: any, index: number) => {
      // Detect function context if not provided by AI
      const functionContext = rec.functionContext || detectFunction(rec.title || '', rec.description || '')
      
      return {
        id: `rec-${Date.now()}-${index}`,
        canDoAgentically: rec.canDoAgentically ?? false,
        agenticDescription: rec.agenticDescription || '',
        manualDescription: rec.manualDescription || '',
        functionContext,
        ...rec
      }
    }) as Recommendation[]
    
    // Filter out recommendations that match existing roadmap items
    recommendations = recommendations.filter(rec => {
      const recTitleLower = rec.title?.toLowerCase().trim() || ''
      // Check if this recommendation title is similar to any existing roadmap item
      const isDuplicate = existingTaskTitles.some(existingTitle => {
        // Check for exact match or very similar
        if (recTitleLower === existingTitle) return true
        // Check if recommendation title contains existing title or vice versa
        if (recTitleLower.includes(existingTitle) || existingTitle.includes(recTitleLower)) {
          // Only consider it duplicate if overlap is significant (more than 50% of shorter string)
          const shorter = recTitleLower.length < existingTitle.length ? recTitleLower : existingTitle
          const longer = recTitleLower.length >= existingTitle.length ? recTitleLower : existingTitle
          if (shorter.length > 0 && longer.includes(shorter)) {
            return shorter.length > 10 // Only flag if significant overlap
          }
        }
        return false
      })
      return !isDuplicate
    })
    
    // Sort by priority and impact - high priority first, then by whether AI can do it (agentic tasks prioritized)
    recommendations.sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      // If same priority, prefer agentic tasks
      if (a.canDoAgentically !== b.canDoAgentically) {
        return a.canDoAgentically ? -1 : 1
      }
      return 0
    })
    
    // Log for debugging
    if (recommendations.length === 0) {
      console.log('[RecommendationEngine] No recommendations after filtering. Existing tasks:', existingTaskTitles.length)
      console.log('[RecommendationEngine] Raw recommendations from AI:', recommendationsArray.length)
    }

    return recommendations
  } catch (error: any) {
    console.error('[RecommendationEngine] Error:', error)
    return []
  }
}

/**
 * Get recommendations for a specific area
 */
export async function getRecommendationsByType(
  userId: string,
  type: Recommendation['type']
): Promise<Recommendation[]> {
  const all = await generateRecommendations(userId)
  return all.filter(r => r.type === type)
}

