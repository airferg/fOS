import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase-server'
import { agentRegistry } from '@/lib/agents'

/**
 * Get list of all available agents
 * GET /api/agents
 * Optional query param: ?category=CategoryName
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get optional category filter
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    // Get agents
    const agents = category
      ? agentRegistry.getAllByCategory(category)
      : agentRegistry.getAll()

    // Return agent metadata (without execute method)
    const agentsList = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      icon: agent.icon
    }))

    return NextResponse.json({
      agents: agentsList,
      count: agentsList.length
    })
  } catch (error: any) {
    console.error('Error listing agents:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
