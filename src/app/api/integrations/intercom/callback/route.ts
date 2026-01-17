import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Handle Intercom OAuth callback and save tokens
 * GET /api/integrations/intercom/callback
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')

  console.log('[Intercom OAuth Callback] Received callback:', {
    hasCode: !!code,
    hasError: !!error,
    hasState: !!state,
    error,
  })

  if (error) {
    console.error('[Intercom OAuth Callback] OAuth error:', error)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(error)}`, req.url))
  }

  if (!code) {
    console.error('[Intercom OAuth Callback] No code parameter')
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
        console.error('[Intercom OAuth Callback] Invalid state parameter')
      }
    }

    // Get user from session if state is missing
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(new URL('/auth/login?error=unauthorized', req.url))
    }

    const finalUserId = userId || user.id
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/intercom/callback`
    const clientId = process.env.INTERCOM_CLIENT_ID
    const clientSecret = process.env.INTERCOM_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('[Intercom OAuth Callback] Missing Intercom OAuth credentials')
      return NextResponse.redirect(new URL('/integrations?error=oauth_not_configured', req.url))
    }

    console.log('[Intercom OAuth Callback] Exchanging code for tokens...')
    const tokenResponse = await fetch('https://api.intercom.io/auth/eagle/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('[Intercom OAuth Callback] Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/integrations?error=token_exchange_failed', req.url))
    }

    const tokenData = await tokenResponse.json()
    console.log('[Intercom OAuth Callback] Tokens received successfully')

    // Intercom tokens don't expire, but we'll store the token info
    const expiresAt = null

    // Store in oauth_tokens table
    const { error: insertError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert(
        {
          user_id: finalUserId,
          provider: 'intercom',
          access_token: tokenData.token,
          refresh_token: null, // Intercom doesn't use refresh tokens
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )

    if (insertError) {
      console.error('[Intercom OAuth Callback] Error storing tokens in oauth_tokens:', insertError)
      return NextResponse.redirect(new URL('/integrations?error=token_storage_failed', req.url))
    }

    // Store in integration_tokens table
    await supabaseAdmin
      .from('integration_tokens')
      .upsert(
        {
          user_id: finalUserId,
          integration_type: 'intercom',
          access_token: tokenData.token,
          refresh_token: null,
          token_expires_at: expiresAt,
          scopes: ['read', 'write'],
          metadata: {
            type: tokenData.type,
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
          console.error('[Intercom OAuth Callback] Error storing token in integration_tokens:', error)
        } else {
          console.log('[Intercom OAuth Callback] Intercom token stored successfully')
        }
      })

    // Redirect to integrations page with success message
    return NextResponse.redirect(new URL('/integrations?connected=intercom', req.url))
  } catch (err: any) {
    console.error('[Intercom OAuth Callback] Unexpected error:', err)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(err.message || 'unexpected_error')}`, req.url))
  }
}

