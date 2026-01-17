/**
 * Integration Requirements
 * Queries database for tool and agent integration requirements
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'

export interface ToolIntegrationRequirement {
  tool_id: string
  tool_name: string
  required_integration: string
  is_required: boolean
  description: string | null
}

export interface AgentIntegrationRequirement {
  agent_id: string
  agent_name: string
  required_integration: string
  is_required: boolean
  description: string | null
}

/**
 * Get all integration requirements for a specific tool
 */
export async function getToolIntegrationRequirements(
  toolId: string
): Promise<ToolIntegrationRequirement[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('tool_integration_requirements')
    .select('*')
    .eq('tool_id', toolId)

  if (error || !data) {
    console.warn(`No integration requirements found for tool: ${toolId}`, error)
    return []
  }

  return data as ToolIntegrationRequirement[]
}

/**
 * Get all integration requirements for a specific agent
 */
export async function getAgentIntegrationRequirements(
  agentId: string
): Promise<AgentIntegrationRequirement[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('agent_integration_requirements')
    .select('*')
    .eq('agent_id', agentId)

  if (error || !data) {
    console.warn(`No integration requirements found for agent: ${agentId}`, error)
    return []
  }

  return data as AgentIntegrationRequirement[]
}

/**
 * Get all required integrations for a tool (only required ones)
 */
export async function getRequiredIntegrationsForTool(
  toolId: string
): Promise<string[]> {
  const requirements = await getToolIntegrationRequirements(toolId)
  return requirements
    .filter(req => req.is_required)
    .map(req => req.required_integration)
}

/**
 * Get all required integrations for an agent (only required ones)
 */
export async function getRequiredIntegrationsForAgent(
  agentId: string
): Promise<string[]> {
  const requirements = await getAgentIntegrationRequirements(agentId)
  return requirements
    .filter(req => req.is_required)
    .map(req => req.required_integration)
}

/**
 * Get all integration requirements for multiple tools
 * Returns a map of tool_id -> integration[]
 */
export async function getToolIntegrationMap(
  toolIds: string[]
): Promise<Record<string, string[]>> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('tool_integration_requirements')
    .select('tool_id, required_integration, is_required')
    .in('tool_id', toolIds)
    .eq('is_required', true)

  if (error || !data) {
    console.warn('Error fetching tool integration map:', error)
    return {}
  }

  const map: Record<string, string[]> = {}
  data.forEach((req: any) => {
    if (!map[req.tool_id]) {
      map[req.tool_id] = []
    }
    map[req.tool_id].push(req.required_integration)
  })

  return map
}

/**
 * Get all integration requirements for multiple agents
 * Returns a map of agent_id -> integration[]
 */
export async function getAgentIntegrationMap(
  agentIds: string[]
): Promise<Record<string, string[]>> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('agent_integration_requirements')
    .select('agent_id, required_integration, is_required')
    .in('agent_id', agentIds)
    .eq('is_required', true)

  if (error || !data) {
    console.warn('Error fetching agent integration map:', error)
    return {}
  }

  const map: Record<string, string[]> = {}
  data.forEach((req: any) => {
    if (!map[req.agent_id]) {
      map[req.agent_id] = []
    }
    map[req.agent_id].push(req.required_integration)
  })

  return map
}

