import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * PATCH /api/recommendations/[id]
 * Update recommendation status (e.g., mark as added_to_roadmap or dismissed)
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

    const { status, related_roadmap_item_id } = await req.json()

    const updateData: any = {}
    if (status) updateData.status = status
    if (related_roadmap_item_id) updateData.related_roadmap_item_id = related_roadmap_item_id

    const { data, error } = await supabase
      .from('recommendations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ recommendation: data })
  } catch (error: any) {
    console.error('[Recommendations Update API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update recommendation' },
      { status: 500 }
    )
  }
}

