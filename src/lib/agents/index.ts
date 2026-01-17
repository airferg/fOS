/**
 * Agent registry and exports
 * Import all agents here to register them
 */

// Import tools first (they register themselves)
import './tools'

// Import agents to register them
import './draft-investor-email'
import './generate-product-spec'
import './analyze-customer-feedback'
import './parse-linkedin-csv'
import './task-executor'

// Export framework
export { executeAgent, agentRegistry, BaseAgent } from './agent-framework'
export type { Agent, AgentContext } from './agent-framework'
export type { AgentResponse } from '@/lib/openai'

// Export types
export * from './types'

// Export tools
export { toolRegistry } from './tools'
export type { Tool } from './tools'
