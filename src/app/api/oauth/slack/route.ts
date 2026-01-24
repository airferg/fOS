import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Slack OAuth flow
 *
 * Step 1: Redirect user to Slack authorization
 * GET /api/oauth/slack
 *
 * Step 2: Handle callback from Slack
 * GET /api/oauth/slack/callback
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  // If we have a code, this is the callback
  if (code) {
    return handleCallback(code, state)
  }

  // Otherwise, initiate OAuth flow
  return initiateOAuth()
}

async function initiateOAuth() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }

  const clientId = process.env.SLACK_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/slack`

  if (!clientId) {
    return NextResponse.json(
      { error: 'Slack integration not configured' },
      { status: 500 }
    )
  }

  // Generate state for CSRF protection
  const state = Buffer.from(JSON.stringify({ userId: user.id, timestamp: Date.now() })).toString('base64')

  // Slack OAuth scopes needed
  const scopes = [
    'channels:read',
    'channels:history',
    'users:read',
    'team:read',
    'chat:write',
  ].join(',')

  const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize')
  slackAuthUrl.searchParams.set('client_id', clientId)
  slackAuthUrl.searchParams.set('redirect_uri', redirectUri)
  slackAuthUrl.searchParams.set('scope', scopes)
  slackAuthUrl.searchParams.set('state', state)

  return NextResponse.redirect(slackAuthUrl.toString())
}

async function handleCallback(code: string, state: string | null) {
  const supabase = await createServerSupabaseClient()

  if (!state) {
    return NextResponse.redirect(
      new URL('/communication?error=invalid_state', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    )
  }

  // Verify state
  let stateData
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString())
  } catch (error) {
    return NextResponse.redirect(
      new URL('/communication?error=invalid_state', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== stateData.userId) {
    return NextResponse.redirect(
      new URL('/communication?error=unauthorized', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    )
  }

  // Exchange code for access token
  const clientId = process.env.SLACK_CLIENT_ID
  const clientSecret = process.env.SLACK_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/slack`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/communication?error=config_error', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    )
  }

  try {
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.ok) {
      throw new Error(tokenData.error || 'Failed to exchange code for token')
    }

    // Store Slack integration data
    const { error: insertError } = await supabase.from('integrations').insert({
      user_id: user.id,
      name: 'Slack',
      category: 'Communication',
      is_connected: true,
      credentials: {
        access_token: tokenData.access_token,
        team_id: tokenData.team.id,
        team_name: tokenData.team.name,
        bot_user_id: tokenData.bot_user_id,
        authed_user: tokenData.authed_user,
      },
      metadata: {
        scope: tokenData.scope,
        token_type: tokenData.token_type,
      },
    })

    if (insertError) {
      console.error('Failed to store Slack integration:', insertError)
      throw insertError
    }

    return NextResponse.redirect(
      new URL('/communication?success=slack_connected', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    )
  } catch (error: any) {
    console.error('Slack OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/communication?error=${encodeURIComponent(error.message)}`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    )
  }
}
