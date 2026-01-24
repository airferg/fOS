import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Fetch channels from Slack
 * GET /api/slack/channels
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Slack integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('name', 'Slack')
      .eq('is_connected', true)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Slack not connected' },
        { status: 404 }
      )
    }

    const accessToken = integration.credentials.access_token

    // Fetch channels from Slack API
    const response = await fetch('https://slack.com/api/conversations.list', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!data.ok) {
      throw new Error(data.error || 'Failed to fetch channels')
    }

    // Transform channel data
    const channels = data.channels.map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      is_private: channel.is_private,
      is_archived: channel.is_archived,
      num_members: channel.num_members,
      topic: channel.topic?.value || '',
      purpose: channel.purpose?.value || '',
    }))

    return NextResponse.json({
      success: true,
      channels,
    })
  } catch (error: any) {
    console.error('Slack channels error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}
