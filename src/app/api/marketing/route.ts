import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/marketing - Get all marketing platforms
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: platforms, error } = await supabase
      .from('marketing_platforms')
      .select('*')
      .eq('user_id', user.id)
      .order('followers', { ascending: false })

    if (error) throw error

    // Calculate aggregate stats
    const totalFollowers = platforms?.reduce((sum, p) => sum + (p.followers || 0), 0) || 0
    const totalReach = platforms?.reduce((sum, p) => sum + (p.reach || 0), 0) || 0
    const avgEngagement = platforms?.length
      ? platforms.reduce((sum, p) => sum + (Number(p.engagement_rate) || 0), 0) / platforms.length
      : 0

    return NextResponse.json({
      platforms: platforms || [],
      stats: {
        totalFollowers,
        totalReach,
        avgEngagement: avgEngagement.toFixed(2),
        connectedPlatforms: platforms?.filter(p => p.is_connected).length || 0
      }
    })
  } catch (error: any) {
    console.error('Error fetching marketing platforms:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/marketing - Add/update a marketing platform
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      platform_name,
      platform_handle,
      followers,
      reach,
      engagement_rate,
      growth_rate,
      is_connected
    } = body

    // Upsert platform
    const { data: platform, error } = await supabase
      .from('marketing_platforms')
      .upsert({
        user_id: user.id,
        platform_name,
        platform_handle,
        followers: followers || 0,
        reach: reach || 0,
        engagement_rate: engagement_rate || 0,
        growth_rate: growth_rate || 0,
        is_connected: is_connected || false,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform_name'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ platform })
  } catch (error: any) {
    console.error('Error updating marketing platform:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
