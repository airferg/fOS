import { BaseAgent, agentRegistry } from './agent-framework'
import { AgentResponse } from '@/lib/openai'
import { EmailDraft, MetricsSummary } from './types'

interface InvestorEmailInput {
  tone?: 'professional' | 'casual' | 'optimistic'
  focusAreas?: string[]
  includeMetrics?: boolean
}

interface InvestorEmailOutput {
  email: EmailDraft
  metrics: MetricsSummary
}

/**
 * Agent that drafts investor update emails based on current metrics and progress
 */
export class DraftInvestorEmailAgent extends BaseAgent<InvestorEmailInput, InvestorEmailOutput> {
  id = 'draft-investor-email'
  name = 'Draft Investor Update'
  description = 'Generate a professional investor update email with current metrics and progress'
  category = 'Fundraising'
  icon = '📧'

  async execute(
    input: InvestorEmailInput,
    userId: string
  ): Promise<AgentResponse<InvestorEmailOutput>> {
    try {
      // Get user context
      const context = await this.getUserContext(userId)
      const { profile, roadmapItems, contacts, documents } = context

      // Calculate metrics
      const metrics = this.calculateMetrics(profile, roadmapItems, contacts)

      // Build the prompt for OpenAI
      const systemPrompt = `You are an expert startup advisor helping founders write compelling investor update emails.

Your task is to draft a professional, concise investor update email that:
- Highlights key progress and wins
- Is honest about challenges
- Shows momentum and traction
- Includes relevant metrics
- Ends with a clear ask or next step

The email should be ${input.tone || 'professional'} in tone and approximately 300-500 words.`

      const userPrompt = this.buildUserPrompt(input, metrics, roadmapItems, profile)

      // Call OpenAI to generate the email
      const { content, tokensUsed } = await this.callOpenAI(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.7,
          maxTokens: 1500,
          responseFormat: 'json'
        }
      )

      // Parse the response
      const emailData = JSON.parse(content)

      const email: EmailDraft = {
        subject: emailData.subject || 'Update from FounderOS',
        body: emailData.body || content,
        to: '',
        cc: []
      }

      return {
        success: true,
        data: {
          email,
          metrics
        },
        tokensUsed
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to draft investor email: ${error.message}`
      }
    }
  }

  private calculateMetrics(profile: any, roadmapItems: any[], contacts: any[]): MetricsSummary {
    // Calculate runway (users table has funds_available, not budget)
    // Default values if fields don't exist
    const monthlyBurn = 10000 // Default monthly burn (users table doesn't have this field yet)
    const currentBudget = profile?.funds_available || profile?.budget || 100000
    const runwayMonths = monthlyBurn > 0 ? currentBudget / monthlyBurn : 0
    const runwayWeeks = Math.floor(runwayMonths * 4.33)
    const runwayDays = Math.floor(runwayMonths * 30)

    // Calculate task completion
    const completedTasks = roadmapItems.filter(item => item.status === 'done').length
    const totalTasks = roadmapItems.length

    // Calculate active contacts (contacted in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeContacts = contacts.filter(contact =>
      contact.last_contacted && new Date(contact.last_contacted) > thirtyDaysAgo
    ).length

    return {
      timeRemaining: {
        weeks: runwayWeeks,
        days: runwayDays
      },
      budgetStatus: {
        spent: 0, // Can't calculate without initial_budget field
        remaining: currentBudget,
        burnRate: monthlyBurn
      },
      teamSize: 1, // Default (users table doesn't have team_size field)
      activeContacts,
      completedTasks,
      totalTasks
    }
  }

  private buildUserPrompt(
    input: InvestorEmailInput,
    metrics: MetricsSummary,
    roadmapItems: any[],
    profile: any
  ): string {
    const completionRate = metrics.totalTasks > 0
      ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
      : 0

    const recentCompletions = roadmapItems
      .filter(item => item.status === 'done')
      .slice(0, 5)
      .map(item => item.title)

    const inProgressItems = roadmapItems
      .filter(item => item.status === 'in_progress')
      .slice(0, 3)
      .map(item => item.title)

    const focusAreas = input.focusAreas?.join(', ') || 'product development, customer acquisition, fundraising'

    return `Draft an investor update email with the following information:

COMPANY: ${profile?.company_name || profile?.name || 'My Startup'}
FOUNDER: ${profile?.full_name || profile?.name || 'Founder'}

CURRENT METRICS:
- Runway: ${metrics.timeRemaining.weeks} weeks (${metrics.timeRemaining.days} days)
- Budget Remaining: $${metrics.budgetStatus.remaining.toLocaleString()}
- Monthly Burn: $${metrics.budgetStatus.burnRate.toLocaleString()}
- Team Size: ${metrics.teamSize}
- Active Network Contacts: ${metrics.activeContacts}
- Task Completion Rate: ${completionRate}%

RECENT WINS:
${recentCompletions.length > 0 ? recentCompletions.map(t => `- ${t}`).join('\n') : '- Building initial product\n- Conducting customer research'}

CURRENTLY WORKING ON:
${inProgressItems.length > 0 ? inProgressItems.map(t => `- ${t}`).join('\n') : '- Product development\n- Market validation'}

FOCUS AREAS: ${focusAreas}

${input.includeMetrics !== false ? 'Include specific metrics in the email.' : 'Focus on qualitative progress.'}

Return the response as JSON with this structure:
{
  "subject": "Brief, compelling subject line",
  "body": "Full email body in plain text with paragraphs separated by \\n\\n"
}

The email should:
1. Start with a hook or headline
2. Share 2-3 key wins or progress updates
3. Be honest about 1-2 challenges (if any)
4. Include relevant metrics
5. End with what's next and any asks
6. Keep it concise (300-500 words)`
  }
}

// Register the agent
agentRegistry.register(new DraftInvestorEmailAgent())
