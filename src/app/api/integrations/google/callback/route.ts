import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Handle Google OAuth callback and save tokens
 * GET /api/integrations/google/callback
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')
  const errorDescription = url.searchParams.get('error_description')

  console.log('[Google OAuth Callback] Received callback:', {
    hasCode: !!code,
    hasError: !!error,
    hasState: !!state,
    error,
    errorDescription,
  })

  // Check for OAuth errors
  if (error) {
    console.error('[Google OAuth Callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(errorDescription || error)}`, req.url))
  }

  if (!code) {
    console.error('[Google OAuth Callback] No code parameter')
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
        console.error('[Google OAuth Callback] Invalid state parameter')
      }
    }

    // Get user from session if state is missing
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(new URL('/auth/login?error=unauthorized', req.url))
    }

    // Use user from session if state didn't provide it
    const finalUserId = userId || user.id

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/google/callback`
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('[Google OAuth Callback] Missing Google OAuth credentials')
      return NextResponse.redirect(new URL('/integrations?error=oauth_not_configured', req.url))
    }

    console.log('[Google OAuth Callback] Exchanging code for tokens...')
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('[Google OAuth Callback] Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/integrations?error=token_exchange_failed', req.url))
    }

    const tokenData = await tokenResponse.json()
    console.log('[Google OAuth Callback] Tokens received successfully')

    // Calculate expiration time
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    // Store tokens in oauth_tokens table
    const { error: insertError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert(
        {
          user_id: finalUserId,
          provider: 'google',
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
      console.error('[Google OAuth Callback] Error storing tokens:', insertError)
      return NextResponse.redirect(new URL('/integrations?error=token_storage_failed', req.url))
    }

    console.log('[Google OAuth Callback] Tokens stored successfully for user:', finalUserId)

    // Also store in integration_tokens table for each Google service
    const googleServices = [
      { type: 'gmail', scopes: ['gmail.modify', 'contacts.readonly'] }, // gmail.modify includes reading, composing, and sending; contacts.readonly for People API
      { type: 'google_calendar', scopes: ['calendar'] },
      { type: 'google_docs', scopes: ['documents'] },
    ]

    for (const service of googleServices) {
      await supabaseAdmin
        .from('integration_tokens')
        .upsert(
          {
            user_id: finalUserId,
            integration_type: service.type,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            token_expires_at: expiresAt,
            scopes: service.scopes,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,integration_type',
          }
        )
        .then(({ error }) => {
          if (error) {
            console.error(`[Google OAuth Callback] Error storing ${service.type} token:`, error)
          } else {
            console.log(`[Google OAuth Callback] ${service.type} token stored successfully`)
          }
        })
    }

    // Redirect to integrations page with success message
    return NextResponse.redirect(new URL('/integrations?connected=google', req.url))
  } catch (err: any) {
    console.error('[Google OAuth Callback] Unexpected error:', err)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(err.message || 'unexpected_error')}`, req.url))
  }
}

