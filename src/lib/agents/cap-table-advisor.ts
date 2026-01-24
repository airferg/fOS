import { BaseAgent, agentRegistry } from './agent-framework'
import { AgentResponse } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface CapTableInput {
  scenario?: {
    raiseAmount?: number
    valuation?: number
    hiringPlan?: { role: string; equity: number }[]
  }
  question?: string
}

interface CapTableOutput {
  currentOwnership: number
  projectedOwnership?: number
  dilution?: number
  analysis: string
  benchmarks?: string[]
  recommendations?: string[]
}

/**
 * Agent that helps founders understand dilution, equity breakdown, and benchmarks
 */
export class CapTableAdvisorAgent extends BaseAgent<CapTableInput, CapTableOutput> {
  id = 'cap-table-advisor'
  name = 'Cap Table & Equity Advisor'
  description = 'Understand dilution, equity breakdown, and standard benchmarks'
  category = 'Fundraising'
  icon = '📉'

  async execute(
    input: CapTableInput,
    userId: string
  ): Promise<AgentResponse<CapTableOutput>> {
    try {
      const supabase = await createServerSupabaseClient()
      const context = await this.getUserContext(userId)

      // Fetch team and funding data
      const [
        { data: teamMembers },
        { data: fundingRounds }
      ] = await Promise.all([
        supabase.from('team_members').select('*').eq('user_id', userId),
        supabase.from('funding_rounds').select('*').eq('user_id', userId)
      ])

      // Calculate current equity distribution
      const founderEquity = teamMembers?.filter((m: any) => m.role === 'Founder')
        .reduce((sum: number, m: any) => sum + (m.equity_percent || 0), 0) || 0
      
      const employeeEquity = teamMembers?.filter((m: any) => m.role !== 'Founder')
        .reduce((sum: number, m: any) => sum + (m.equity_percent || 0), 0) || 0

      const totalRaised = fundingRounds?.filter((r: any) => r.status === 'closed')
        .reduce((sum: number, r: any) => sum + (Number(r.amount_raised) || 0), 0) || 0

      const currentOwnership = founderEquity

      const systemPrompt = `You are an expert cap table advisor helping founders understand equity and dilution. Provide clear, actionable advice with industry benchmarks. Keep responses concise (max 200 words).`

      const userPrompt = `Analyze this startup's equity situation:

CURRENT EQUITY:
- Founder ownership: ${founderEquity}%
- Employee equity: ${employeeEquity}%
- Total allocated: ${founderEquity + employeeEquity}%
- Total raised: $${totalRaised.toLocaleString()}

TEAM BREAKDOWN:
${teamMembers?.map((m: any) => `- ${m.name}: ${m.role} (${m.equity_percent || 0}%)`).join('\n') || '- No team members tracked'}

${input.scenario?.raiseAmount 
  ? `\nSCENARIO:\n- Raising: $${input.scenario.raiseAmount.toLocaleString()}\n- Valuation: $${(input.scenario.valuation || 0).toLocaleString()}\n- New hires planned: ${input.scenario.hiringPlan?.map((h: any) => `${h.role} (${h.equity}%)`).join(', ') || 'None'}`
  : ''}

${input.question ? `\nQUESTION: ${input.question}` : ''}

Return JSON:
{
  "currentOwnership": <current founder %>,
  "projectedOwnership": <projected % if scenario provided>,
  "dilution": <dilution % if scenario provided>,
  "analysis": "Brief analysis of current situation",
  "benchmarks": ["benchmark1", "benchmark2"],
  "recommendations": ["recommendation1", "recommendation2"]
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
          currentOwnership: result.currentOwnership || currentOwnership,
          projectedOwnership: result.projectedOwnership,
          dilution: result.dilution,
          analysis: result.analysis || 'Equity analysis complete.',
          benchmarks: result.benchmarks || [],
          recommendations: result.recommendations || []
        },
        tokensUsed
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to analyze cap table: ${error.message}`
      }
    }
  }
}

agentRegistry.register(new CapTableAdvisorAgent())

