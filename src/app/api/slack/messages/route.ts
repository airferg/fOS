import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Fetch messages from Slack
 * GET /api/slack/messages?channel=<channel_id>&limit=<limit>
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

    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channel')
    const limit = parseInt(searchParams.get('limit') || '50')

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

    // Fetch messages from Slack API
    const url = new URL('https://slack.com/api/conversations.history')
    if (channelId) {
      url.searchParams.set('channel', channelId)
    }
    url.searchParams.set('limit', limit.toString())

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!data.ok) {
      throw new Error(data.error || 'Failed to fetch messages')
    }

    // Fetch user info for message authors
    const userIds = [...new Set(data.messages.map((m: any) => m.user))]
    const userInfoPromises = userIds.map(async (userId) => {
      const userResponse = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      return userResponse.json()
    })

    const userInfos = await Promise.all(userInfoPromises)
    const userMap = new Map(
      userInfos
        .filter((info) => info.ok)
        .map((info) => [info.user.id, info.user])
    )

    // Enrich messages with user info
    const enrichedMessages = data.messages.map((message: any) => ({
      id: message.ts,
      text: message.text,
      user_id: message.user,
      user_name: userMap.get(message.user)?.real_name || 'Unknown',
      user_avatar: userMap.get(message.user)?.profile?.image_72,
      timestamp: new Date(parseFloat(message.ts) * 1000).toISOString(),
      channel: channelId,
    }))

    return NextResponse.json({
      success: true,
      messages: enrichedMessages,
    })
  } catch (error: any) {
    console.error('Slack messages error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
