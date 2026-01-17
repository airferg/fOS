import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { executeAgent } from '@/lib/agents'

/**
 * Execute an AI agent
 * POST /api/agents/execute
 * Body: { agentId: string, input: any }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication (using same pattern as other routes)
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Agent execute: Authentication failed', authError)
      return NextResponse.json(
        { error: 'Unauthorized. Please log out and log back in to refresh your session.' },
        { status: 401 }
      )
    }

    // Parse request body
    const { agentId, input } = await req.json()

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId' },
        { status: 400 }
      )
    }

    // Execute the agent
    const result = await executeAgent(agentId, input || {}, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      tokensUsed: result.tokensUsed
    })
  } catch (error: any) {
    console.error('Agent execution error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
