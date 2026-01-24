import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/tools - Get all tools
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('tools')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: tools, error } = await query

    if (error) throw error

    // Calculate stats
    const totalCost = tools?.reduce((sum, tool) => sum + (Number(tool.monthly_cost) || 0), 0) || 0
    const connectedCount = tools?.filter(t => t.integration_status === 'connected').length || 0

    return NextResponse.json({
      tools: tools || [],
      stats: {
        total: tools?.length || 0,
        connected: connectedCount,
        totalMonthlyCost: totalCost
      }
    })
  } catch (error: any) {
    console.error('Error fetching tools:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tools - Add a new tool
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, category, monthly_cost, logo_url, description, integration_status } = body

    // Create tool
    const { data: tool, error } = await supabase
      .from('tools')
      .insert({
        user_id: user.id,
        name,
        category,
        monthly_cost: monthly_cost || 0,
        logo_url,
        description,
        integration_status: integration_status || 'not_connected'
      })
      .select()
      .single()

    if (error) throw error

    // Create activity feed entry
    await supabase.from('activity_feed').insert({
      user_id: user.id,
      activity_type: 'tool_connected',
      title: `${name} added to toolstack`,
      description: `New ${category} tool connected`,
      metadata: { tool_id: tool.id, category, monthly_cost },
      icon: ''
    })

    return NextResponse.json({ tool })
  } catch (error: any) {
    console.error('Error creating tool:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
