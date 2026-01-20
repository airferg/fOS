/**
 * Task Executor Agent
 * Autonomous agent that reasons about tasks and uses available tools
 * Uses OpenAI function calling to decide which tools to use and execute them
 */

import { BaseAgent, agentRegistry } from './agent-framework'
import { AgentResponse } from '@/lib/openai'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { toolRegistry } from './tools'
import { getConnectedIntegrations, checkIntegrationStatus } from '@/lib/integrations/integration-monitor'
import { getToolIntegrationMap } from '@/lib/integrations/integration-requirements'

interface TaskExecutorInput {
  task: string
  context?: Record<string, any>
}

interface TaskExecutorOutput {
  result: string
  steps: number
  toolsUsed: string[]
  actions: Array<{
    tool: string
    result: any
  }>
  missingIntegrations?: string[] // Integrations needed but not connected
  requiredIntegrations?: string[] // All integrations this task requires
}

export class TaskExecutorAgent extends BaseAgent<TaskExecutorInput, TaskExecutorOutput> {
  id = 'task-executor'
  name = 'Task Executor'
  description = 'Autonomously executes tasks using available tools and integrations. The AI reasons about how to complete the task and uses tools as needed.'
  category = 'System'
  icon = '🤖'
  
  // Store current taskId for tool execution
  private currentTaskId?: string

  async execute(
    input: TaskExecutorInput,
    userId: string
  ): Promise<AgentResponse<TaskExecutorOutput>> {
    // Extract taskId from input if provided (from executeAgent)
    this.currentTaskId = (input as any).taskId || undefined
    try {
      // Get user context
      const context = await this.getUserContext(userId)
      const { profile, roadmapItems, contacts, documents } = context

      // Get available tools and check which integrations are connected
      const tools = toolRegistry.getAllTools()
      const toolsDescription = toolRegistry.getToolsDescription()
      const openAIFunctions = toolRegistry.getOpenAIFunctions()
      const connectedIntegrations = await getConnectedIntegrations(userId)

      // Get integration requirements from database
      const toolIds = tools.map(tool => tool.id)
      const toolIntegrationMap = await getToolIntegrationMap(toolIds)

      // Determine which integrations this task might need based on tools
      const potentialIntegrations = new Set<string>()
      tools.forEach(tool => {
        const requiredIntegrations = toolIntegrationMap[tool.id] || []
        requiredIntegrations.forEach(integration => {
          potentialIntegrations.add(integration)
        })
      })

      // Check which required integrations are missing
      const requiredIntegrations = Array.from(potentialIntegrations)
      const missingIntegrations: string[] = []
      requiredIntegrations.forEach(integration => {
        if (!connectedIntegrations.has(integration)) {
          missingIntegrations.push(integration)
        }
      })

      // Build system prompt
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
      
      const systemPrompt = `AI agent for startup founders. Complete tasks using available tools.

Dates: Today ${today} | Tomorrow ${tomorrow} | Week: ${oneWeekLater} | Month: ${oneMonthLater} | Year: ${oneYearLater}
Tools: ${toolsDescription.split('\n').slice(0, 10).join('\n')} // First 10 tools only

Task execution:
1. Use function calling to execute tools
2. Continue until task complete
3. Max 2 sentences in final response
4. Include links: "Created [tool]: [link]"

Date handling: Use dates above. "Tomorrow" = ${tomorrow}. "Next week" = ${oneWeekLater}. Calculate from TODAY.
Integration errors: 1 sentence only. Example: "Google Calendar required - Settings > Integrations"

Context: ${profile?.name || 'Founder'} | Goal: ${profile?.current_goal || 'None'} | Building: ${profile?.building_description || 'N/A'} | Contacts: ${contacts.length}

Contact lookup: Use 'lookup_contact' tool when user mentions a name. Searches DB + Gmail.`

      const userPrompt = `Task: ${input.task}

${input.context ? `Additional Context: ${JSON.stringify(input.context, null, 2)}` : ''}

Break down this task and execute it using the available tools. Use function calling to invoke tools as needed.`

      // Initialize conversation
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]

      // Agentic execution loop
      let maxIterations = 15
      let iteration = 0
      const actions: Array<{ tool: string; result: any }> = []
      const toolsUsed: string[] = []
      let lastCompletion: any = null

      while (iteration < maxIterations) {
        // Call OpenAI with function calling
        const completion = await openai.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: messages,
          tools: openAIFunctions.length > 0 ? openAIFunctions : undefined,
          tool_choice: openAIFunctions.length > 0 ? 'auto' : undefined,
          temperature: 0.7,
          max_tokens: 800 // Optimized: Brief task execution responses
        })

        lastCompletion = completion
        const message = completion.choices[0].message
        messages.push(message)

        // Check if AI wants to call tools
        if (message.tool_calls && message.tool_calls.length > 0) {
          const toolResults = []

          for (const toolCall of message.tool_calls) {
            // Type guard: check if toolCall has function property
            if (!('function' in toolCall) || !toolCall.function) {
              console.error('[Task Executor] Invalid tool call format:', toolCall)
              continue
            }

            const functionName = toolCall.function.name
            const tool = toolRegistry.getTool(functionName)
            
            if (!tool) {
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: functionName,
                content: JSON.stringify({ error: `Tool "${functionName}" not found` })
              })
              continue
            }

            try {
              const params = JSON.parse(toolCall.function.arguments || '{}')
              
              console.log(`[Task Executor] Executing tool: ${tool.name}`, params)
              
              // Pass taskId to tool for approval tracking
              const result = await tool.execute(params, userId, { agentTaskId: this.currentTaskId })
              
              // Check if tool requires approval
              if (result.requiresApproval) {
                // Return early with approval info
                return {
                  success: true,
                  data: {
                    result: result.message || 'Action requires approval',
                    steps: iteration,
                    toolsUsed: [...new Set(toolsUsed)],
                    actions,
                    requiresApproval: true,
                    approvalId: result.approvalId,
                    preview: result.preview
                  } as any,
                  tokensUsed: 0
                }
              }
              
              toolsUsed.push(functionName)
              actions.push({
                tool: functionName,
                result
              })

              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: functionName,
                content: JSON.stringify(result)
              })
            } catch (error: any) {
              console.error(`[Task Executor] Tool error: ${functionName}`, error)
              
              // If tool returns an error object (not thrown), include it
              const errorContent = error.connected === false 
                ? JSON.stringify(error) // Tool returned error object
                : JSON.stringify({ 
                    error: error.message || 'Tool execution failed',
                    details: error.toString()
                  })
              
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: functionName,
                content: errorContent
              })
            }
          }

          // Add tool results to conversation
          messages.push(...toolResults)
          iteration++
          lastCompletion = completion
        } else {
          // AI is done - return final response
          lastCompletion = completion
          break
        }
      }

      const finalMessage = messages[messages.length - 1]
      const result = finalMessage.content || 'Task completed'

      // Get token usage from last completion
      let tokensUsed = 0
      if (lastCompletion?.usage) {
        tokensUsed = lastCompletion.usage.total_tokens
      }

      return {
        success: true,
        data: {
          result,
          steps: iteration,
          toolsUsed: [...new Set(toolsUsed)],
          actions
        },
        tokensUsed
      }
    } catch (error: any) {
      console.error('[Task Executor] Error:', error)
      return {
        success: false,
        error: error.message || 'Failed to execute task'
      }
    }
  }
}

// Register the agent
agentRegistry.register(new TaskExecutorAgent())

