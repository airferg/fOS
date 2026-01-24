import { BaseAgent, agentRegistry } from './agent-framework'
import { AgentResponse } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface PMFInput {
  userQuotes?: string[]
  disappointmentPercent?: number
}

interface PMFOutput {
  score: number
  breakdown: {
    retention: number
    revenue: number
    feedback: number
    growth: number
  }
  recommendation: string
  color: 'red' | 'yellow' | 'green'
}

/**
 * Agent that assesses Product-Market Fit based on engagement and feedback
 */
export class ProductMarketFitTrackerAgent extends BaseAgent<PMFInput, PMFOutput> {
  id = 'product-market-fit-tracker'
  name = 'Product-Market Fit Score'
  description = 'Assess whether your startup shows signs of Product-Market Fit'
  category = 'Product'
  icon = '📊'

  async execute(
    input: PMFInput,
    userId: string
  ): Promise<AgentResponse<PMFOutput>> {
    try {
      const supabase = await createServerSupabaseClient()
      const context = await this.getUserContext(userId)

      // Fetch relevant data
      const [
        { data: marketingPlatforms },
        { data: fundingRounds },
        { data: roadmapItems }
      ] = await Promise.all([
        supabase.from('marketing_platforms').select('*').eq('user_id', userId),
        supabase.from('funding_rounds').select('*').eq('user_id', userId),
        supabase.from('roadmap_items').select('*').eq('user_id', userId)
      ])

      // Calculate signals
      const totalReach = marketingPlatforms?.reduce((sum: number, p: any) => sum + (p.reach || 0), 0) || 0
      const avgEngagement = marketingPlatforms?.length
        ? marketingPlatforms.reduce((sum: number, p: any) => sum + (Number(p.engagement_rate) || 0), 0) / marketingPlatforms.length
        : 0

      const totalRaised = fundingRounds?.filter((r: any) => r.status === 'closed')
        .reduce((sum: number, r: any) => sum + (Number(r.amount_raised) || 0), 0) || 0

      const completedTasks = roadmapItems?.filter((r: any) => r.status === 'done').length || 0
      const totalTasks = roadmapItems?.length || 0
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      const systemPrompt = `You are an expert PMF assessor. Score 0-100 across 4 dimensions:
1. Retention (25 points) - user engagement, task completion, repeat usage
2. Revenue (25 points) - funding raised, revenue signals, monetization
3. Feedback (25 points) - user quotes, satisfaction signals, NPS-like indicators
4. Growth (25 points) - marketing reach, engagement rate, growth trajectory

Provide a concise recommendation (max 100 words) focused on actionable next steps.`

      const userPrompt = `Assess Product-Market Fit for this startup:

RETENTION SIGNALS:
- Task completion rate: ${completionRate.toFixed(1)}%
- Completed tasks: ${completedTasks}/${totalTasks}
- Active roadmap items: ${roadmapItems?.filter((r: any) => r.status === 'in_progress').length || 0}

REVENUE SIGNALS:
- Total funding raised: $${totalRaised.toLocaleString()}
- Funding rounds: ${fundingRounds?.length || 0}

FEEDBACK SIGNALS:
${input.userQuotes && input.userQuotes.length > 0 
  ? `User quotes:\n${input.userQuotes.map((q: string) => `- "${q}"`).join('\n')}`
  : '- No user quotes provided'}
${input.disappointmentPercent !== undefined 
  ? `- Would be disappointed if product disappeared: ${input.disappointmentPercent}%`
  : '- Disappointment metric: Not provided'}

GROWTH SIGNALS:
- Total marketing reach: ${totalReach.toLocaleString()}
- Average engagement rate: ${avgEngagement.toFixed(1)}%
- Active marketing platforms: ${marketingPlatforms?.length || 0}

Return JSON:
{
  "score": <0-100>,
  "breakdown": {
    "retention": <0-25>,
    "revenue": <0-25>,
    "feedback": <0-25>,
    "growth": <0-25>
  },
  "recommendation": "Brief actionable recommendation",
  "color": "red" | "yellow" | "green"
}`

      const { content, tokensUsed } = await this.callOpenAI(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.3,
          maxTokens: 350,
          responseFormat: 'json'
        }
      )

      const result = JSON.parse(content)

      // Determine color
      const score = result.score || 0
      const color: 'red' | 'yellow' | 'green' = score < 40 ? 'red' : score < 70 ? 'yellow' : 'green'

      return {
        success: true,
        data: {
          score,
          breakdown: result.breakdown || { retention: 0, revenue: 0, feedback: 0, growth: 0 },
          recommendation: result.recommendation || 'Continue gathering user feedback and tracking metrics.',
          color
        },
        tokensUsed
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to calculate PMF score: ${error.message}`
      }
    }
  }
}

agentRegistry.register(new ProductMarketFitTrackerAgent())

