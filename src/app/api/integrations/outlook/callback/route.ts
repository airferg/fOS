import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Handle Outlook OAuth callback and save tokens
 * GET /api/integrations/outlook/callback
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')
  const errorDescription = url.searchParams.get('error_description')

  console.log('[Outlook OAuth Callback] Received callback:', {
    hasCode: !!code,
    hasError: !!error,
    hasState: !!state,
    error,
    errorDescription,
  })

  if (error) {
    console.error('[Outlook OAuth Callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(errorDescription || error)}`, req.url))
  }

  if (!code) {
    console.error('[Outlook OAuth Callback] No code parameter')
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
        console.error('[Outlook OAuth Callback] Invalid state parameter')
      }
    }

    // Get user from session if state is missing
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(new URL('/auth/login?error=unauthorized', req.url))
    }

    const finalUserId = userId || user.id
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/outlook/callback`
    const clientId = process.env.OUTLOOK_CLIENT_ID
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET
    const tenantId = process.env.OUTLOOK_TENANT_ID || 'common'

    if (!clientId || !clientSecret) {
      console.error('[Outlook OAuth Callback] Missing Outlook OAuth credentials')
      return NextResponse.redirect(new URL('/integrations?error=oauth_not_configured', req.url))
    }

    console.log('[Outlook OAuth Callback] Exchanging code for tokens...')
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'Mail.ReadWrite Mail.Send offline_access',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('[Outlook OAuth Callback] Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/integrations?error=token_exchange_failed', req.url))
    }

    const tokenData = await tokenResponse.json()
    console.log('[Outlook OAuth Callback] Tokens received successfully')

    // Calculate expiration time
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    // Store in oauth_tokens table
    const { error: insertError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert(
        {
          user_id: finalUserId,
          provider: 'outlook',
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
      console.error('[Outlook OAuth Callback] Error storing tokens in oauth_tokens:', insertError)
      return NextResponse.redirect(new URL('/integrations?error=token_storage_failed', req.url))
    }

    // Store in integration_tokens table
    await supabaseAdmin
      .from('integration_tokens')
      .upsert(
        {
          user_id: finalUserId,
          integration_type: 'outlook',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expires_at: expiresAt,
          scopes: ['Mail.ReadWrite', 'Mail.Send'],
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,integration_type',
        }
      )
      .then(({ error }) => {
        if (error) {
          console.error('[Outlook OAuth Callback] Error storing token in integration_tokens:', error)
        } else {
          console.log('[Outlook OAuth Callback] Outlook token stored successfully')
        }
      })

    // Redirect to integrations page with success message
    return NextResponse.redirect(new URL('/integrations?connected=outlook', req.url))
  } catch (err: any) {
    console.error('[Outlook OAuth Callback] Unexpected error:', err)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(err.message || 'unexpected_error')}`, req.url))
  }
}

