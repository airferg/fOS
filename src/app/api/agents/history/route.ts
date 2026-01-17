import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Get agent execution history for the current user
 * GET /api/agents/history
 * Optional query params: ?limit=10&agentId=draft-investor-email
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const agentId = searchParams.get('agentId')

    // Build query
    let query = supabase
      .from('agent_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    const { data: tasks, error } = await query

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({
          tasks: [],
          message: 'Agent tasks table not yet created. Run migration first.'
        })
      }
      throw error
    }

    return NextResponse.json({
      tasks: tasks || [],
      count: tasks?.length || 0
    })
  } catch (error: any) {
    console.error('Error fetching agent history:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
