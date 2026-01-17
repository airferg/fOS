import { BaseAgent, agentRegistry } from './agent-framework'
import { AgentResponse } from '@/lib/openai'
import { DocumentGeneration } from './types'

interface ProductSpecInput {
  roadmapItemId?: string
  featureTitle?: string
  featureDescription?: string
  includeUserStories?: boolean
  includeAcceptanceCriteria?: boolean
}

interface ProductSpecOutput {
  document: DocumentGeneration
  wordCount: number
}

/**
 * Agent that generates product specification documents from roadmap items
 */
export class GenerateProductSpecAgent extends BaseAgent<ProductSpecInput, ProductSpecOutput> {
  id = 'generate-product-spec'
  name = 'Generate Product Spec'
  description = 'Create detailed product specification documents from roadmap items'
  category = 'Product'
  icon = '📋'

  async execute(
    input: ProductSpecInput,
    userId: string
  ): Promise<AgentResponse<ProductSpecOutput>> {
    try {
      // Get user context
      const context = await this.getUserContext(userId)
      const { profile, roadmapItems } = context

      // Get the specific roadmap item if provided
      let featureTitle = input.featureTitle || 'New Feature'
      let featureDescription = input.featureDescription || ''

      if (input.roadmapItemId) {
        const roadmapItem = roadmapItems.find(item => item.id === input.roadmapItemId)
        if (roadmapItem) {
          featureTitle = roadmapItem.title
          featureDescription = roadmapItem.description || ''
        }
      }

      // Build prompts
      const systemPrompt = `You are a senior product manager with expertise in writing clear, comprehensive product specifications.

Your task is to create a detailed Product Requirements Document (PRD) that includes:
- Overview and objectives
- User personas and use cases
- Detailed feature specifications
- Technical requirements
- Success metrics
${input.includeUserStories ? '- User stories with acceptance criteria' : ''}
${input.includeAcceptanceCriteria ? '- Acceptance criteria for each feature' : ''}

Write in a clear, structured format using markdown.`

      const userPrompt = `Create a product specification document for:

FEATURE: ${featureTitle}
DESCRIPTION: ${featureDescription || 'No additional description provided'}

COMPANY CONTEXT:
- Company: ${profile?.company_name || 'Startup'}
- Stage: ${profile?.stage || 'Early stage'}
- Target Market: ${profile?.target_market || 'TBD'}

The document should be comprehensive enough for engineering to implement, but concise enough to be digestible.

Return the response as JSON with this structure:
{
  "title": "Document title",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content in markdown"
    }
  ]
}

Include these sections:
1. Overview & Objectives
2. User Personas & Use Cases
3. Feature Specifications
4. Technical Requirements
5. Success Metrics & KPIs
${input.includeUserStories ? '6. User Stories' : ''}
${input.includeAcceptanceCriteria ? '7. Acceptance Criteria' : ''}`

      // Call OpenAI
      const { content, tokensUsed } = await this.callOpenAI(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.6,
          maxTokens: 3000,
          responseFormat: 'json'
        }
      )

      // Parse response
      const docData = JSON.parse(content)

      // Build full markdown document
      const fullContent = docData.sections
        .map((section: any) => `## ${section.heading}\n\n${section.content}`)
        .join('\n\n')

      const document: DocumentGeneration = {
        title: docData.title || featureTitle,
        content: fullContent,
        format: 'markdown',
        sections: docData.sections || []
      }

      const wordCount = fullContent.split(/\s+/).length

      return {
        success: true,
        data: {
          document,
          wordCount
        },
        tokensUsed
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to generate product spec: ${error.message}`
      }
    }
  }
}

// Register the agent
agentRegistry.register(new GenerateProductSpecAgent())
