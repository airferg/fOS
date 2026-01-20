import { openai, DEFAULT_MODEL, AgentResponse } from '@/lib/openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Base interface that all agents must implement
 */
export interface Agent<TInput = any, TOutput = any> {
  id: string
  name: string
  description: string
  category: string
  icon: string
  execute(input: TInput, userId: string): Promise<AgentResponse<TOutput>>
}

/**
 * Agent execution context
 */
export interface AgentContext {
  userId: string
  taskId?: string
}

/**
 * Base agent class with common functionality
 */
export abstract class BaseAgent<TInput = any, TOutput = any> implements Agent<TInput, TOutput> {
  abstract id: string
  abstract name: string
  abstract description: string
  abstract category: string
  abstract icon: string

  /**
   * Main execution method - must be implemented by subclasses
   */
  abstract execute(input: TInput, userId: string): Promise<AgentResponse<TOutput>>

  /**
   * Helper to call OpenAI with tracking
   */
  protected async callOpenAI(
    systemPrompt: string,
    userPrompt: string,
    options: {
      model?: string
      temperature?: number
      maxTokens?: number
      responseFormat?: 'text' | 'json'
    } = {}
  ): Promise<{ content: string; tokensUsed: number }> {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 600, // Optimized for cost efficiency - brief responses only
      responseFormat = 'text'
    } = options

    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {})
      })

      const content = completion.choices[0]?.message?.content || ''
      const tokensUsed = completion.usage?.total_tokens || 0

      return { content, tokensUsed }
    } catch (error: any) {
      // Extract error details (OpenAI SDK error structure)
      const errorMessage = error.message || error.error?.message || 'Unknown error'
      const errorType = error.type || error.error?.type || 'unknown'
      const errorCode = error.code || error.status || error.statusCode || error.error?.code || 'unknown'
      
      // Log full error details for debugging
      console.error('[BaseAgent] OpenAI API error details:', {
        message: errorMessage,
        type: errorType,
        code: errorCode,
        status: error.status,
        statusCode: error.statusCode,
        model,
        responseFormat,
        fullError: error,
        errorResponse: error.response?.data,
        errorObject: error.error,
        stack: error.stack?.substring(0, 500) // First 500 chars of stack
      })
      
      // Build user-friendly error message based on error type
      let detailedMessage: string
      
      if (errorCode === 'insufficient_quota' || errorType === 'insufficient_quota') {
        detailedMessage = `OpenAI API quota exceeded. Your account has run out of credits or hit usage limits. Please check your OpenAI billing dashboard (https://platform.openai.com/account/billing) to add credits or upgrade your plan.`
      } else if (errorCode === 'rate_limit_exceeded' || errorType === 'rate_limit_exceeded' || error.status === 429) {
        detailedMessage = `OpenAI API rate limit exceeded. Too many requests in a short period. Please wait a moment and try again.`
      } else if (errorCode === 'invalid_api_key' || errorType === 'invalid_api_key') {
        detailedMessage = `OpenAI API key is invalid. Please check your OPENAI_API_KEY environment variable.`
      } else if (errorCode === 'model_not_found' || errorType === 'model_not_found') {
        detailedMessage = `OpenAI model not found. The model "${model}" may not be available. Please check your OpenAI account and model availability.`
      } else {
        // Generic error with details
        detailedMessage = `OpenAI API error`
        if (errorCode && errorCode !== 'unknown') {
          detailedMessage += ` (code: ${errorCode})`
        }
        if (errorType && errorType !== 'unknown') {
          detailedMessage += ` (type: ${errorType})`
        }
        detailedMessage += `: ${errorMessage}`
        
        // Include additional context if available
        if (error.error?.param) {
          detailedMessage += ` (param: ${error.error.param})`
        }
      }
      
      throw new Error(detailedMessage)
    }
  }

  /**
   * Helper to get user context from database
   */
  protected async getUserContext(userId: string): Promise<{
    profile: any
    roadmapItems: any[]
    contacts: any[]
    documents: any[]
  }> {
    const supabase = await createServerSupabaseClient()

    const [
      { data: profile },
      { data: roadmapItems },
      { data: contacts },
      { data: documents }
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('roadmap_items').select('*').eq('user_id', userId),
      supabase.from('contacts').select('*').eq('user_id', userId),
      supabase.from('documents').select('*').eq('user_id', userId)
    ])

    return {
      profile: profile || {},
      roadmapItems: roadmapItems || [],
      contacts: contacts || [],
      documents: documents || []
    }
  }
}

/**
 * Agent registry to store and retrieve agents
 */
class AgentRegistry {
  private agents = new Map<string, Agent>()

  register(agent: Agent) {
    this.agents.set(agent.id, agent)
  }

  get(id: string): Agent | undefined {
    return this.agents.get(id)
  }

  getAll(): Agent[] {
    return Array.from(this.agents.values())
  }

  getAllByCategory(category: string): Agent[] {
    return this.getAll().filter(agent => agent.category === category)
  }
}

export const agentRegistry = new AgentRegistry()

/**
 * Execute an agent and track its execution in the database
 */
export async function executeAgent<TInput = any, TOutput = any>(
  agentId: string,
  input: TInput,
  userId: string
): Promise<AgentResponse<TOutput>> {
  const supabase = await createServerSupabaseClient()
  const agent = agentRegistry.get(agentId)

  if (!agent) {
    return {
      success: false,
      error: `Agent not found: ${agentId}`
    }
  }

  // Create task record (optional - table might not exist yet)
  let taskId: string | undefined
  try {
    const { data: task, error: createError } = await supabase
      .from('agent_tasks')
      .insert({
        user_id: userId,
        agent_id: agent.id,
        agent_name: agent.name,
        status: 'running',
        input: input as any,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      // Table might not exist - that's okay, tracking is optional
      console.warn('Failed to create task record (table may not exist):', createError.message)
    } else {
      taskId = task?.id
    }
  } catch (error: any) {
    // Table doesn't exist - continue without tracking
    console.warn('agent_tasks table not found - continuing without task tracking')
  }

  try {
    // Execute the agent
    const startTime = Date.now()
    
    // For TaskExecutorAgent, include taskId in input for tool execution tracking
    let agentInput = input as any
    if (agentId === 'task-executor' && taskId) {
      agentInput = { ...input as any, taskId }
    }
    
    const result = await agent.execute(agentInput, userId)
    const duration = Date.now() - startTime

    // Update task record with results (if task was created)
    if (taskId) {
      try {
        await supabase
          .from('agent_tasks')
          .update({
            status: result.success ? 'completed' : 'failed',
            output: result.data as any,
            error_message: result.error,
            tokens_used: result.tokensUsed,
            completed_at: new Date().toISOString()
          })
          .eq('id', taskId)
      } catch (error) {
        // Ignore errors - table might not exist
      }
    }

    console.log(`Agent ${agentId} executed in ${duration}ms`)

    return result
  } catch (error: any) {
    // Update task as failed (if task was created)
    if (taskId) {
      try {
        await supabase
          .from('agent_tasks')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', taskId)
      } catch (updateError) {
        // Ignore errors - table might not exist
      }
    }

    return {
      success: false,
      error: error.message
    }
  }
}
