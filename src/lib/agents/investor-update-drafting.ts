import { BaseAgent, agentRegistry } from './agent-framework'
import { AgentResponse } from '@/lib/openai'
import { EmailDraft } from './types'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface InvestorUpdateInput {
  wins?: string[]
  challenges?: string[]
  asks?: string[]
  includeMetrics?: boolean
}

interface InvestorUpdateOutput {
  email: EmailDraft
  metrics?: {
    runway?: number
    burn?: number
    growth?: number
  }
}

/**
 * Agent that drafts polished, metrics-rich investor updates
 */
export class InvestorUpdateDraftingAgent extends BaseAgent<InvestorUpdateInput, InvestorUpdateOutput> {
  id = 'investor-update-drafting'
  name = 'Draft Investor Update'
  description = 'Craft polished, metrics-rich monthly investor updates'
  category = 'Fundraising'
  icon = '📢'

  async execute(
    input: InvestorUpdateInput,
    userId: string
  ): Promise<AgentResponse<InvestorUpdateOutput>> {
    try {
      const context = await this.getUserContext(userId)
      const { profile, roadmapItems } = context
      const supabase = await createServerSupabaseClient()

      // Fetch funding and marketing data
      const [
        { data: fundingRounds },
        { data: teamMembers },
        { data: marketingPlatforms }
      ] = await Promise.all([
        supabase.from('funding_rounds').select('*').eq('user_id', userId),
        supabase.from('team_members').select('*').eq('user_id', userId),
        supabase.from('marketing_platforms').select('*').eq('user_id', userId)
      ])

      // Calculate metrics
      const totalRaised = fundingRounds?.filter((r: any) => r.status === 'closed')
        .reduce((sum: number, r: any) => sum + (Number(r.amount_raised) || 0), 0) || 0
      
      const currentBudget = profile?.funds_available || 100000
      const monthlyBurn = profile?.monthly_burn || Math.round(currentBudget / 12)
      const runwayMonths = monthlyBurn > 0 ? Math.round(currentBudget / monthlyBurn) : 0

      const totalReach = marketingPlatforms?.reduce((sum: number, p: any) => sum + (p.reach || 0), 0) || 0
      const avgEngagement = marketingPlatforms?.length
        ? marketingPlatforms.reduce((sum: number, p: any) => sum + (Number(p.engagement_rate) || 0), 0) / marketingPlatforms.length
        : 0

      const recentWins = roadmapItems
        .filter((item: any) => item.status === 'done')
        .slice(0, 5)
        .map((item: any) => item.title)

      const systemPrompt = `You are an expert startup advisor helping founders write compelling investor update emails. Create professional, concise updates (300-400 words) that highlight wins, acknowledge challenges, and include clear asks.`

      const userPrompt = `Draft an investor update email for:

COMPANY: ${profile?.company_name || profile?.name || 'Startup'}
MONTH: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

WINS (user provided):
${input.wins && input.wins.length > 0 ? input.wins.map((w: string) => `- ${w}`).join('\n') : recentWins.map((w: string) => `- ${w}`).join('\n') || '- Product development progress\n- Team building'}

CHALLENGES (user provided):
${input.challenges && input.challenges.length > 0 ? input.challenges.map((c: string) => `- ${c}`).join('\n') : '- None specified'}

METRICS:
- Total raised: $${totalRaised.toLocaleString()}
- Cash remaining: $${currentBudget.toLocaleString()}
- Monthly burn: $${monthlyBurn.toLocaleString()}
- Runway: ${runwayMonths} months
- Marketing reach: ${totalReach.toLocaleString()}
- Engagement rate: ${avgEngagement.toFixed(1)}%
- Team size: ${teamMembers?.length || 1}

ASKS (user provided):
${input.asks && input.asks.length > 0 ? input.asks.map((a: string) => `- ${a}`).join('\n') : '- Introductions to investors\n- Customer referrals'}

${input.includeMetrics !== false ? 'Include metrics in the update.' : 'Focus on qualitative progress.'}

Return JSON:
{
  "subject": "Month Update – [Company Name]",
  "body": "Email body with sections:\n\nWins:\n...\n\nChallenges:\n...\n\nMetrics:\n...\n\nAsks:\n..."
}`

      const { content, tokensUsed } = await this.callOpenAI(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.7,
          maxTokens: 500,
          responseFormat: 'json'
        }
      )

      const emailData = JSON.parse(content)

      return {
        success: true,
        data: {
          email: {
            subject: emailData.subject || `Update – ${profile?.company_name || 'Startup'}`,
            body: emailData.body || '',
            to: '',
            cc: []
          },
          metrics: {
            runway: runwayMonths,
            burn: monthlyBurn,
            growth: avgEngagement
          }
        },
        tokensUsed
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to draft investor update: ${error.message}`
      }
    }
  }
}

agentRegistry.register(new InvestorUpdateDraftingAgent())

