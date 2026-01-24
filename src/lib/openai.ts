import OpenAI from 'openai'

/**
 * Get OpenAI client instance (lazy initialization)
 * Used for all AI agent operations
 * Only initializes when actually called, not at module load time
 * Returns null if API key is not configured (allows build to succeed)
 */
let _openai: OpenAI | null = null

function getOpenAIClient(): OpenAI | null {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return null
    }
    _openai = new OpenAI({ apiKey })
  }
  return _openai
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getOpenAIClient()
    if (!client) {
      // Return a no-op function for build time
      return () => {
        throw new Error('OpenAI API key not configured')
      }
    }
    const value = client[prop as keyof OpenAI]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
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
