import { BaseAgent, agentRegistry } from './agent-framework'
import { AgentResponse } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface InvestorReadinessInput {
  includePitchDeck?: boolean
}

interface InvestorReadinessOutput {
  totalScore: number
  subscores: {
    team: number
    market: number
    product: number
    traction: number
    fundability: number
  }
  strengths: string[]
  concerns: string[]
  nextSteps: string[]
}

/**
 * Agent that scores a startup's investor readiness
 */
export class InvestorReadinessAgent extends BaseAgent<InvestorReadinessInput, InvestorReadinessOutput> {
  id = 'investor-readiness'
  name = 'Investor Readiness Score'
  description = 'Score your startup\'s investor readiness across team, market, product, traction, and pitch quality'
  category = 'Fundraising'
  icon = '🎯'

  async execute(
    input: InvestorReadinessInput,
    userId: string
  ): Promise<AgentResponse<InvestorReadinessOutput>> {
    try {
      const supabase = await createServerSupabaseClient()
      
      // Fetch all relevant data
      const [
        { data: profile },
        { data: teamMembers },
        { data: fundingRounds },
        { data: investors },
        { data: roadmapItems },
        { data: marketingPlatforms },
        { data: documents }
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('team_members').select('*').eq('user_id', userId),
        supabase.from('funding_rounds').select('*').eq('user_id', userId),
        supabase.from('investors').select('*').eq('user_id', userId),
        supabase.from('roadmap_items').select('*').eq('user_id', userId),
        supabase.from('marketing_platforms').select('*').eq('user_id', userId),
        supabase.from('documents').select('*').eq('user_id', userId).ilike('title', '%pitch%')
      ])

      // Prepare data summary
      const teamData = {
        count: teamMembers?.length || 0,
        founders: teamMembers?.filter((m: any) => m.role === 'Founder').length || 0,
        hasCTO: teamMembers?.some((m: any) => m.role?.toLowerCase().includes('cto') || m.role?.toLowerCase().includes('technical')) || false,
        hasSales: teamMembers?.some((m: any) => m.role?.toLowerCase().includes('sales') || m.role?.toLowerCase().includes('business')) || false,
        totalEquity: teamMembers?.reduce((sum: number, m: any) => sum + (m.equity_percent || 0), 0) || 0
      }

      const fundingData = {
        totalRaised: fundingRounds?.filter((r: any) => r.status === 'closed').reduce((sum: number, r: any) => sum + (Number(r.amount_raised) || 0), 0) || 0,
        investorCount: investors?.length || 0,
        hasLeadInvestor: fundingRounds?.some((r: any) => r.lead_investor) || false,
        activeRound: fundingRounds?.some((r: any) => r.status === 'raising') || false
      }

      const marketingData = {
        totalReach: marketingPlatforms?.reduce((sum: number, p: any) => sum + (p.reach || 0), 0) || 0,
        avgEngagement: marketingPlatforms?.length 
          ? marketingPlatforms.reduce((sum: number, p: any) => sum + (Number(p.engagement_rate) || 0), 0) / marketingPlatforms.length 
          : 0,
        platformCount: marketingPlatforms?.length || 0
      }

      const productData = {
        completedTasks: roadmapItems?.filter((r: any) => r.status === 'done').length || 0,
        totalTasks: roadmapItems?.length || 0,
        inProgress: roadmapItems?.filter((r: any) => r.status === 'in_progress').length || 0
      }

      const pitchDeck = documents?.find((d: any) => d.title?.toLowerCase().includes('pitch'))

      const systemPrompt = `You are an expert VC evaluator scoring startup investor readiness on a 0-100 scale across 5 categories:
1. Team (20 points) - founding team completeness, relevant experience, equity distribution
2. Market (20 points) - market size, product-market fit signals, competitive positioning
3. Product (20 points) - product development progress, roadmap clarity, technical validation
4. Traction (20 points) - revenue, user growth, engagement, customer validation
5. Fundability (20 points) - funding history, investor relationships, pitch quality, stage appropriateness

Provide concise, actionable feedback. Keep responses brief (max 150 words total).`

      const userPrompt = `Score this startup's investor readiness:

COMPANY: ${profile?.company_name || profile?.name || 'Startup'}
BUILDING: ${profile?.building_description || 'Not specified'}
CURRENT GOAL: ${profile?.current_goal || 'Not specified'}

TEAM:
- Total members: ${teamData.count}
- Founders: ${teamData.founders}
- Has CTO: ${teamData.hasCTO ? 'Yes' : 'No'}
- Has Sales/Biz Dev: ${teamData.hasSales ? 'Yes' : 'No'}
- Total equity allocated: ${teamData.totalEquity}%

FUNDING:
- Total raised: $${fundingData.totalRaised.toLocaleString()}
- Investors: ${fundingData.investorCount}
- Has lead investor: ${fundingData.hasLeadInvestor ? 'Yes' : 'No'}
- Currently raising: ${fundingData.activeRound ? 'Yes' : 'No'}

TRACTION/MARKETING:
- Total reach: ${marketingData.totalReach.toLocaleString()}
- Avg engagement rate: ${marketingData.avgEngagement.toFixed(1)}%
- Active platforms: ${marketingData.platformCount}

PRODUCT:
- Completed tasks: ${productData.completedTasks}/${productData.totalTasks}
- In progress: ${productData.inProgress}

PITCH DECK: ${pitchDeck ? 'Available' : 'Not found'}

Provide a JSON response with:
{
  "totalScore": <0-100>,
  "subscores": {
    "team": <0-20>,
    "market": <0-20>,
    "product": <0-20>,
    "traction": <0-20>,
    "fundability": <0-20>
  },
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "nextSteps": ["step1", "step2"]
}`

      const { content, tokensUsed } = await this.callOpenAI(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.3,
          maxTokens: 400,
          responseFormat: 'json'
        }
      )

      const result = JSON.parse(content)

      return {
        success: true,
        data: {
          totalScore: result.totalScore || 0,
          subscores: result.subscores || { team: 0, market: 0, product: 0, traction: 0, fundability: 0 },
          strengths: result.strengths || [],
          concerns: result.concerns || [],
          nextSteps: result.nextSteps || []
        },
        tokensUsed
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to calculate investor readiness: ${error.message}`
      }
    }
  }
}

agentRegistry.register(new InvestorReadinessAgent())

