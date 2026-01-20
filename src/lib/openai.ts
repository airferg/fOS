import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

/**
 * OpenAI client instance configured with API key
 * Used for all AI agent operations
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Default model for AI agents
 * Using GPT-4 Turbo for high-quality outputs
 */
export const DEFAULT_MODEL = 'gpt-4-turbo-preview'

/**
 * Default max tokens - optimized for cost efficiency
 * Keeps responses brief and actionable
 */
export const DEFAULT_MAX_TOKENS = 600

/**
 * Agent response structure
 */
export interface AgentResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  tokensUsed?: number
}

/**
 * Agent execution metadata
 */
export interface AgentExecution {
  id: string
  agentId: string
  userId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: Record<string, any>
  output?: Record<string, any>
  error?: string
  tokensUsed?: number
  startedAt: Date
  completedAt?: Date
}
