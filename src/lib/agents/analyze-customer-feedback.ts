import { BaseAgent, agentRegistry } from './agent-framework'
import { AgentResponse } from '@/lib/openai'
import { AnalysisResult } from './types'

interface CustomerFeedbackInput {
  feedbackText?: string
  source?: 'interview' | 'survey' | 'support' | 'other'
  includeSentiment?: boolean
  includeActionItems?: boolean
}

interface CustomerFeedbackOutput {
  analysis: AnalysisResult
  sentiment: 'positive' | 'neutral' | 'negative'
  painPoints: Array<{
    point: string
    severity: 'high' | 'medium' | 'low'
    frequency: number
  }>
  featureRequests: string[]
  actionItems: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    category: string
  }>
}

/**
 * Agent that analyzes customer feedback to extract insights and action items
 */
export class AnalyzeCustomerFeedbackAgent extends BaseAgent<CustomerFeedbackInput, CustomerFeedbackOutput> {
  id = 'analyze-customer-feedback'
  name = 'Analyze Customer Feedback'
  description = 'Extract insights, pain points, and action items from customer conversations'
  category = 'Customer Development'
  icon = '🔍'

  async execute(
    input: CustomerFeedbackInput,
    userId: string
  ): Promise<AgentResponse<CustomerFeedbackOutput>> {
    try {
      // Get user context for additional context
      const context = await this.getUserContext(userId)
      const { profile, documents } = context

      // If no feedback text provided, try to pull from recent documents
      let feedbackText = input.feedbackText || ''

      if (!feedbackText && documents.length > 0) {
        // Look for interview notes or feedback documents
        const feedbackDocs = documents
          .filter(doc =>
            doc.name?.toLowerCase().includes('interview') ||
            doc.name?.toLowerCase().includes('feedback') ||
            doc.name?.toLowerCase().includes('customer')
          )
          .slice(0, 3)

        if (feedbackDocs.length > 0) {
          feedbackText = feedbackDocs
            .map(doc => `${doc.name}:\n${doc.content || ''}`)
            .join('\n\n---\n\n')
        }
      }

      if (!feedbackText) {
        return {
          success: false,
          error: 'No feedback text provided and no customer feedback documents found'
        }
      }

      // Build prompts
      const systemPrompt = `You are an expert product researcher and UX analyst specializing in qualitative customer feedback analysis.

Your task is to:
1. Identify key themes and patterns
2. Extract specific pain points with severity ratings
3. Identify feature requests
4. Determine overall sentiment
5. Generate actionable recommendations

Be thorough but concise. Focus on insights that can drive product decisions.`

      const userPrompt = `Analyze the following customer feedback:

SOURCE: ${input.source || 'General'}
PRODUCT CONTEXT: ${profile?.company_name || 'Product'} - ${profile?.value_proposition || 'Early stage startup'}

FEEDBACK:
${feedbackText}

Analyze this feedback and return JSON with this structure:
{
  "summary": "1-2 paragraph summary of key themes",
  "sentiment": "positive|neutral|negative",
  "painPoints": [
    {
      "point": "Specific pain point description",
      "severity": "high|medium|low",
      "frequency": 1-10 (how often mentioned/implied)
    }
  ],
  "featureRequests": ["Feature 1", "Feature 2"],
  "insights": ["Insight 1", "Insight 2"],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"],
  "actionItems": [
    {
      "action": "Specific action to take",
      "priority": "high|medium|low",
      "category": "product|marketing|sales|support"
    }
  ]
}

${input.includeSentiment !== false ? 'Include detailed sentiment analysis.' : ''}
${input.includeActionItems !== false ? 'Include specific, actionable next steps.' : ''}`

      // Call OpenAI
      const { content, tokensUsed } = await this.callOpenAI(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.5,
          maxTokens: 2500,
          responseFormat: 'json'
        }
      )

      // Parse response
      const analysisData = JSON.parse(content)

      const analysis: AnalysisResult = {
        summary: analysisData.summary || '',
        insights: analysisData.insights || [],
        recommendations: analysisData.recommendations || [],
        data: {
          source: input.source,
          analyzedAt: new Date().toISOString()
        }
      }

      return {
        success: true,
        data: {
          analysis,
          sentiment: analysisData.sentiment || 'neutral',
          painPoints: analysisData.painPoints || [],
          featureRequests: analysisData.featureRequests || [],
          actionItems: analysisData.actionItems || []
        },
        tokensUsed
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to analyze customer feedback: ${error.message}`
      }
    }
  }
}

// Register the agent
agentRegistry.register(new AnalyzeCustomerFeedbackAgent())
