import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/approvals/[id]
 * Get a single approval by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: approval, error } = await supabase
      .from('pending_approvals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    return NextResponse.json({ approval })
  } catch (error: any) {
    console.error('[Approvals API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch approval' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/approvals/[id]
 * Update approval status (approve, reject, or modify)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, modified_data, rejection_reason } = await req.json()

    if (!status || !['approved', 'rejected', 'modified'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved, rejected, or modified' },
        { status: 400 }
      )
    }

    // If modified, require modified_data
    if (status === 'modified' && !modified_data) {
      return NextResponse.json(
        { error: 'modified_data is required when status is modified' },
        { status: 400 }
      )
    }

    // Get the approval first
    const { data: approval, error: fetchError } = await supabase
      .from('pending_approvals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    // Update approval
    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString()
    }

    if (status === 'modified' && modified_data) {
      updateData.modified_data = modified_data
      // Use modified_data for action_data when executing
      updateData.action_data = { ...approval.action_data, ...modified_data }
    }

    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    const { data: updatedApproval, error } = await supabase
      .from('pending_approvals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[Approvals API] Error updating approval:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If approved or modified, we'll need to execute the action
    // This will be handled by the frontend or a separate endpoint
    if (status === 'approved' || status === 'modified') {
      return NextResponse.json({
        approval: updatedApproval,
        success: true,
        executeAction: true, // Frontend should execute the action
        actionData: updatedApproval.action_data
      })
    }

    return NextResponse.json({
      approval: updatedApproval,
      success: true,
      executeAction: false
    })
  } catch (error: any) {
    console.error('[Approvals API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update approval' },
      { status: 500 }
    )
  }
}

