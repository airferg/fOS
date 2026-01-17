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
      maxTokens = 2000,
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
      throw new Error(`OpenAI API error: ${error.message}`)
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
    const result = await agent.execute(input, userId)
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
