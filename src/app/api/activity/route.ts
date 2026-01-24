import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/activity - Get activity feed
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data: activities, error } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      activities: activities || []
    })
  } catch (error: any) {
    console.error('Error fetching activity feed:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/activity - Create an activity entry
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { activity_type, title, description, actor_name, metadata, icon } = body

    const { data: activity, error } = await supabase
      .from('activity_feed')
      .insert({
        user_id: user.id,
        activity_type,
        title,
        description,
        actor_name,
        metadata: metadata || {},
        icon: icon || ''
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ activity })
  } catch (error: any) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
