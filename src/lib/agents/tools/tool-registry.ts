/**
 * Tool Registry
 * Central registry for all callable tools/integrations
 * Used by agentic AI to reason about and execute actions
 */

export interface Tool {
  id: string
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, any>
    required: string[]
  }
  execute: (params: any, userId: string) => Promise<any>
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map()

  register(tool: Tool) {
    this.tools.set(tool.id, tool)
  }

  getTool(id: string): Tool | undefined {
    return this.tools.get(id)
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tools as OpenAI function definitions for function calling
   */
  getOpenAIFunctions(): any[] {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function',
      function: {
        name: tool.id,
        description: tool.description,
        parameters: tool.parameters
      }
    }))
  }

  /**
   * Get available tools as a readable list for prompts
   */
  getToolsDescription(): string {
    return Array.from(this.tools.values())
      .map(tool => `- ${tool.name} (${tool.id}): ${tool.description}`)
      .join('\n')
  }
}

export const toolRegistry = new ToolRegistry()

