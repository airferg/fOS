import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/communication - Get channels and messages
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')

    // Get all channels
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (channelsError) throw channelsError

    // If channelId is provided, get messages for that channel
    let messages = []
    if (channelId) {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError
      messages = messagesData || []
    }

    // Get team members for the sidebar
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('id, name, role, avatar_url, is_online')
      .eq('user_id', user.id)

    if (teamError) throw teamError

    return NextResponse.json({
      channels: channels || [],
      messages,
      teamMembers: teamMembers || []
    })
  } catch (error: any) {
    console.error('Error fetching communication data:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/communication - Send a message
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, content, senderName } = body

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        sender_name: senderName,
        content,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Log to activity feed
    await supabase.from('activity_feed').insert({
      user_id: user.id,
      activity_type: 'message_sent',
      title: `New message in channel`,
      description: content.substring(0, 100),
      actor_name: senderName,
      icon: ''
    })

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
