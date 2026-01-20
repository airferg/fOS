import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/approvals
 * Get pending approvals for the user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') || 'pending'

    const { data: approvals, error } = await supabase
      .from('pending_approvals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[Approvals API] Error fetching approvals:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      approvals: approvals || [],
      count: (approvals || []).length
    })
  } catch (error: any) {
    console.error('[Approvals API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/approvals
 * Create a new approval request
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { agent_task_id, approval_type, action_type, title, description, preview_data, action_data, expires_at } = await req.json()

    if (!approval_type || !action_type || !title || !preview_data || !action_data) {
      return NextResponse.json(
        { error: 'Missing required fields: approval_type, action_type, title, preview_data, action_data' },
        { status: 400 }
      )
    }

    // Set expiry to 24 hours from now if not provided
    const expiryDate = expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data: approval, error } = await supabase
      .from('pending_approvals')
      .insert({
        user_id: user.id,
        agent_task_id: agent_task_id || null,
        approval_type,
        action_type,
        title,
        description: description || null,
        preview_data,
        action_data,
        status: 'pending',
        expires_at: expiryDate
      })
      .select()
      .single()

    if (error) {
      console.error('[Approvals API] Error creating approval:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      approval,
      success: true
    })
  } catch (error: any) {
    console.error('[Approvals API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create approval' },
      { status: 500 }
    )
  }
}

