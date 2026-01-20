import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { executeAgent } from '@/lib/agents'

/**
 * POST /api/strategic/analyze
 * Analyze progress
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { timeframe, focus } = await req.json()

    const result = await executeAgent('progress-analyzer', {
      timeframe: timeframe || 'all',
      focus: focus || 'all'
    }, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis: result.data
    })
  } catch (error: any) {
    console.error('[Progress Analysis API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze progress' },
      { status: 500 }
    )
  }
}

