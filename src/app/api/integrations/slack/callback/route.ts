import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Handle Slack OAuth callback and save tokens
 * GET /api/integrations/slack/callback
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')

  console.log('[Slack OAuth Callback] Received callback:', {
    hasCode: !!code,
    hasError: !!error,
    hasState: !!state,
    error,
  })

  if (error) {
    console.error('[Slack OAuth Callback] OAuth error:', error)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(error)}`, req.url))
  }

  if (!code) {
    console.error('[Slack OAuth Callback] No code parameter')
    return NextResponse.redirect(new URL('/integrations?error=no_code', req.url))
  }

  try {
    // Verify state (CSRF protection)
    let userId: string | null = null
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString())
        userId = decodedState.userId
      } catch (e) {
        console.error('[Slack OAuth Callback] Invalid state parameter')
      }
    }

    // Get user from session if state is missing
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(new URL('/auth/login?error=unauthorized', req.url))
    }

    const finalUserId = userId || user.id
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/slack/callback`
    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('[Slack OAuth Callback] Missing Slack OAuth credentials')
      return NextResponse.redirect(new URL('/integrations?error=oauth_not_configured', req.url))
    }

    console.log('[Slack OAuth Callback] Exchanging code for tokens...')
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

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('[Slack OAuth Callback] Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/integrations?error=token_exchange_failed', req.url))
    }

    const tokenData = await tokenResponse.json()
    console.log('[Slack OAuth Callback] Token response:', { ok: tokenData.ok, hasToken: !!tokenData.access_token })

    if (!tokenData.ok) {
      console.error('[Slack OAuth Callback] Slack API error:', tokenData.error)
      return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(tokenData.error || 'oauth_failed')}`, req.url))
    }

    // Calculate expiration time (Slack tokens don't expire by default, but can have expires_in)
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    // Store in oauth_tokens table
    const { error: insertError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert(
        {
          user_id: finalUserId,
          provider: 'slack',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )

    if (insertError) {
      console.error('[Slack OAuth Callback] Error storing tokens in oauth_tokens:', insertError)
      return NextResponse.redirect(new URL('/integrations?error=token_storage_failed', req.url))
    }

    // Store in integration_tokens table
    await supabaseAdmin
      .from('integration_tokens')
      .upsert(
        {
          user_id: finalUserId,
          integration_type: 'slack',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expires_at: expiresAt,
          scopes: tokenData.scope?.split(',').map((s: string) => s.trim()) || ['chat:write', 'channels:read', 'channels:history'],
          metadata: {
            team_id: tokenData.team?.id,
            team_name: tokenData.team?.name,
            bot_user_id: tokenData.bot_user_id || null, // May not exist for user-level OAuth
            authed_user: tokenData.authed_user || tokenData.user || null,
            is_user_token: !tokenData.bot_user_id, // Flag to indicate user-level vs bot-level token
          },
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,integration_type',
        }
      )
      .then(({ error }) => {
        if (error) {
          console.error('[Slack OAuth Callback] Error storing token in integration_tokens:', error)
        } else {
          console.log('[Slack OAuth Callback] Slack token stored successfully')
        }
      })

    // Redirect to integrations page with success message
    return NextResponse.redirect(new URL('/integrations?connected=slack', req.url))
  } catch (err: any) {
    console.error('[Slack OAuth Callback] Unexpected error:', err)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(err.message || 'unexpected_error')}`, req.url))
  }
}

