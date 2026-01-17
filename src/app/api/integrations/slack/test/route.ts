import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Test Slack integration and fetch channels list
 * GET /api/integrations/slack/test
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Slack access token
    const { data: tokenData, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'slack')
      .single()

    if (tokenError || !tokenData?.access_token) {
      return NextResponse.json({ 
        error: 'Slack not connected',
        message: 'Please connect your Slack account first'
      }, { status: 404 })
    }

    const accessToken = tokenData.access_token

    // Test 1: Fetch team info (includes authed user info)
    const teamInfoResponse = await fetch('https://slack.com/api/team.info', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    const teamInfo = await teamInfoResponse.json()

    // Test 2: Fetch channels list
    const channelsResponse = await fetch('https://slack.com/api/conversations.list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        types: 'public_channel,private_channel',
        exclude_archived: 'true',
      }),
    })
    const channelsData = await channelsResponse.json()

    // Test 3: Fetch reminders (if available)
    const remindersResponse = await fetch('https://slack.com/api/reminders.list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    const remindersData = await remindersResponse.json()

    // Test 4: Auth test (verifies token and gets user info)
    const authTestResponse = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    const authTest = await authTestResponse.json()

    return NextResponse.json({
      success: true,
      connected: true,
      tests: {
        auth_test: {
          ok: authTest.ok,
          user: authTest.user || null,
          user_id: authTest.user_id || null,
          team: authTest.team || null,
          team_id: authTest.team_id || null,
          error: authTest.error || null,
        },
        team_info: {
          ok: teamInfo.ok,
          team_name: teamInfo.team?.name || null,
          error: teamInfo.error || null,
        },
        channels: {
          ok: channelsData.ok,
          count: channelsData.channels?.length || 0,
          channels: channelsData.channels?.slice(0, 10).map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            is_private: ch.is_private,
            is_archived: ch.is_archived,
          })) || [],
          error: channelsData.error || null,
        },
        reminders: {
          ok: remindersData.ok,
          count: remindersData.reminders?.length || 0,
          error: remindersData.error || null,
        },
      },
    })
  } catch (error: any) {
    console.error('[Slack Test] Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Server error',
      success: false 
    }, { status: 500 })
  }
}

