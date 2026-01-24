import { BaseAgent, agentRegistry } from './agent-framework'
import { AgentResponse } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { EmailDraft } from './types'

interface FundraisingCRMInput {
  vcId?: string
  action?: 'analyze' | 'draft-followup'
}

interface VCAnalysis {
  name: string
  firm: string
  lastContact: string
  stage: 'interested' | 'meeting' | 'follow-up' | 'ghosted'
  priority: 'high' | 'low'
  nextSteps: string[]
}

interface FundraisingCRMOutput {
  conversations: VCAnalysis[]
  followUpEmail?: EmailDraft
  forecast?: {
    estimatedRaise: number
    probability: number
  }
}

/**
 * Agent that tracks founder interactions with VCs and automates outreach
 */
export class FundraisingCRMAgent extends BaseAgent<FundraisingCRMInput, FundraisingCRMOutput> {
  id = 'fundraising-crm'
  name = 'Fundraising CRM'
  description = 'Track VC conversations and automate follow-up outreach'
  category = 'Fundraising'
  icon = '💼'

  async execute(
    input: FundraisingCRMInput,
    userId: string
  ): Promise<AgentResponse<FundraisingCRMOutput>> {
    try {
      const supabase = await createServerSupabaseClient()
      const context = await this.getUserContext(userId)

      // Fetch VC contacts and funding data
      const [
        { data: vcContacts },
        { data: investors },
        { data: fundingRounds }
      ] = await Promise.all([
        supabase.from('contacts').select('*').eq('user_id', userId)
          .or('investor_type.eq.VC,investor_type.eq.Angel,investor_category.eq.VC,investor_category.eq.Angel'),
        supabase.from('investors').select('*').eq('user_id', userId),
        supabase.from('funding_rounds').select('*').eq('user_id', userId)
      ])

      // Combine contacts and investors for VC list
      const vcList = [
        ...(investors?.map((inv: any) => ({
          id: inv.id,
          name: inv.name,
          firm: inv.firm || inv.investor_type || 'Unknown',
          lastContact: inv.investment_date || inv.commitment_date,
          type: 'investor'
        })) || []),
        ...(vcContacts?.filter((c: any) => 
          c.investor_type === 'VC' || c.investor_category === 'VC' || 
          c.company?.toLowerCase().includes('capital') || c.company?.toLowerCase().includes('ventures')
        ).map((c: any) => ({
          id: c.id,
          name: c.name,
          firm: c.company || 'Unknown',
          lastContact: c.last_contacted || c.created_at,
          type: 'contact'
        })) || [])
      ]

      if (input.action === 'draft-followup' && input.vcId) {
        const vc = vcList.find((v: any) => v.id === input.vcId)
        if (!vc) {
          return {
            success: false,
            error: 'VC not found'
          }
        }

        // Draft follow-up email
        const systemPrompt = `You are an expert fundraising advisor. Draft concise, professional follow-up emails (150-200 words) that are respectful, value-add focused, and include a clear next step.`

        const profileRes = await supabase.from('users').select('*').eq('id', userId).single()
        const profile = profileRes.data

        const userPrompt = `Draft a follow-up email to:
VC: ${vc.name}
Firm: ${vc.firm}
Last contact: ${vc.lastContact ? new Date(vc.lastContact).toLocaleDateString() : 'Not specified'}

Company: ${profile?.company_name || profile?.name || 'Startup'}
Stage: ${fundingRounds?.find((r: any) => r.status === 'raising')?.round_name || 'Early stage'}

Return JSON:
{
  "subject": "Follow-up: [Brief subject]",
  "body": "Email body"
}`

        const { content, tokensUsed } = await this.callOpenAI(
          systemPrompt,
          userPrompt,
          {
            temperature: 0.7,
            maxTokens: 300,
            responseFormat: 'json'
          }
        )

        const emailData = JSON.parse(content)

        return {
          success: true,
          data: {
            conversations: [],
            followUpEmail: {
              subject: emailData.subject || `Follow-up: ${profile?.company_name || 'Startup'}`,
              body: emailData.body || '',
              to: '',
              cc: []
            }
          },
          tokensUsed
        }
      }

      // Analyze all VC conversations
      const systemPrompt = `You are a fundraising CRM analyzer. Categorize VC conversations into stages and provide next steps. Keep analysis brief (max 50 words per VC).`

      const userPrompt = `Analyze these VC conversations:

${vcList.slice(0, 10).map((vc: any, i: number) => `
${i + 1}. ${vc.name} (${vc.firm})
   Last contact: ${vc.lastContact ? new Date(vc.lastContact).toLocaleDateString() : 'Never'}
`).join('')}

${fundingRounds?.length ? `\nCurrent fundraising: ${fundingRounds.find((r: any) => r.status === 'raising')?.round_name || 'None'}` : ''}

For each VC, determine:
- Stage: interested | meeting | follow-up | ghosted
- Priority: high | low
- Next steps: brief actionable items

Return JSON array:
[
  {
    "name": "VC name",
    "firm": "Firm name",
    "lastContact": "Date or 'Never'",
    "stage": "interested|meeting|follow-up|ghosted",
    "priority": "high|low",
    "nextSteps": ["step1", "step2"]
  }
]`

      const { content, tokensUsed } = await this.callOpenAI(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.3,
          maxTokens: 500,
          responseFormat: 'json'
        }
      )

      const conversations = JSON.parse(content)

      // Calculate forecast (simple probability model)
      const highPriority = conversations.filter((c: VCAnalysis) => c.priority === 'high').length
      const lowPriority = conversations.filter((c: VCAnalysis) => c.priority === 'low').length
      const avgCheckSize = 100000 // Default assumption
      const estimatedRaise = Math.round(
        highPriority * avgCheckSize * 0.3 + lowPriority * avgCheckSize * 0.1
      )

      return {
        success: true,
        data: {
          conversations: conversations || [],
          forecast: {
            estimatedRaise,
            probability: Math.min(95, highPriority * 10 + lowPriority * 5)
          }
        },
        tokensUsed
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to analyze fundraising CRM: ${error.message}`
      }
    }
  }
}

agentRegistry.register(new FundraisingCRMAgent())

