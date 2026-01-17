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

  async execute(
    input: TaskExecutorInput,
    userId: string
  ): Promise<AgentResponse<TaskExecutorOutput>> {
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
      
      const systemPrompt = `You are an autonomous AI agent that helps startup founders complete tasks.

CURRENT DATE CONTEXT:
- Today: ${today}
- Current time: ${now.toISOString()}
- Tomorrow: ${tomorrow}
- One week from now: ${oneWeekLater}
- One month from now: ${oneMonthLater}
- One year from now: ${oneYearLater}

You have access to these tools/integrations:
${toolsDescription}

When given a task:
1. Break it down into logical steps
2. Decide which tools you need to use and in what order
3. Use function calling to execute tools
4. Reason about the results from each tool
5. Continue using tools until the task is complete
6. Provide a clear, SHORT summary (2-3 sentences max)

CRITICAL DATE HANDLING:
- ALWAYS use the CURRENT DATE CONTEXT above when calculating dates
- If user says "tomorrow", use: ${tomorrow}
- If user says "next week", use approximately: ${oneWeekLater}
- If user says "next month", use approximately: ${oneMonthLater}
- If user says "next year" or "within the next year", use: ${oneYearLater}
- If user asks for a specific time period, calculate it from TODAY: ${today}
- DO NOT use hardcoded dates from the past (2023, etc.) - always calculate from current date
- For calendar tools, pass timeMin (start) and timeMax (end) as ISO datetime strings based on user's request
- If the user doesn't specify a time range, use appropriate defaults (e.g., 7 days for general "upcoming" queries)

CRITICAL: Keep all responses SHORT and direct. Maximum 2-3 sentences.

IMPORTANT: When tools return results that include links (url, htmlLink, draftLink), ALWAYS mention the link in your response so users can access what was created. For example: "Created Google Doc: [link]" or "Scheduled calendar event: [link]"

IMPORTANT: If a tool returns an error with "connected: false", it means that integration is not connected. 
In this case, respond BRIEFLY:
- State which integration is needed (e.g., "Google Calendar integration required")
- Tell them to connect it in Settings > Integrations
- Keep it to 1-2 sentences only

You can call multiple tools in sequence. Think step by step. If a tool fails, try to work around it or explain the issue BRIEFLY.

User Context:
- Name: ${profile?.name || 'Founder'}
- Current Goal: ${profile?.current_goal || 'Not set'}
- Building: ${profile?.building_description || 'Not specified'}
- Roadmap Items: ${roadmapItems.slice(0, 5).map((r: any) => r.title).join(', ') || 'None'}
- Contacts: ${contacts.length} contacts in database
${contacts.length > 0 ? `\n- Sample contacts (for reference): ${contacts.slice(0, 10).map((c: any) => `${c.name || 'Unknown'}${c.email ? ` (${c.email})` : ''}`).join(', ')}` : ''}

IMPORTANT - Contact Lookup:
- When user mentions a contact name (e.g., "Kean Harrison", "email it to John"), use the 'lookup_contact' tool to find their email address
- This tool searches both your database contacts AND Gmail contacts
- If contact is found in Gmail but not in database, you can still use their email address
- Always use the lookup_contact tool before drafting emails to ensure you have the correct email address

Remember: Keep all responses SHORT - maximum 2-3 sentences.`

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
          max_tokens: 2000
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
              
              const result = await tool.execute(params, userId)
              
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

