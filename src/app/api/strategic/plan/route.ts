import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { executeAgent } from '@/lib/agents'

/**
 * POST /api/strategic/plan
 * Generate a strategic plan
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { goal, timeframe, focus } = await req.json()

    console.log('[Strategic Plan API] Executing strategic planner agent with input:', {
      goal,
      timeframe: timeframe || 12,
      focus: focus || 'all',
      userId: user.id
    })

    const result = await executeAgent('strategic-planner', {
      goal,
      timeframe: timeframe || 12,
      focus: focus || 'all'
    }, user.id)

    if (!result.success) {
      console.error('[Strategic Plan API] Agent execution failed:', {
        error: result.error,
        agentId: 'strategic-planner'
      })
      return NextResponse.json(
        { error: result.error || 'Failed to generate strategic plan' },
        { status: 500 }
      )
    }

    console.log('[Strategic Plan API] Strategic plan generated successfully')
    return NextResponse.json({
      success: true,
      plan: result.data
    })
  } catch (error: any) {
    console.error('[Strategic Plan API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      error: error
    })
    return NextResponse.json(
      { error: error.message || 'Failed to generate strategic plan' },
      { status: 500 }
    )
  }
}

