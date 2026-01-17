import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Handle QuickBooks OAuth callback and save tokens
 * GET /api/integrations/quickbooks/callback
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')
  const realmId = url.searchParams.get('realmId') // QuickBooks company ID

  console.log('[QuickBooks OAuth Callback] Received callback:', {
    hasCode: !!code,
    hasError: !!error,
    hasState: !!state,
    hasRealmId: !!realmId,
    error,
  })

  if (error) {
    console.error('[QuickBooks OAuth Callback] OAuth error:', error)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(error)}`, req.url))
  }

  if (!code) {
    console.error('[QuickBooks OAuth Callback] No code parameter')
    return NextResponse.redirect(new URL('/integrations?error=no_code', req.url))
  }

  try {
    // Verify state and get code verifier (CSRF protection + PKCE)
    let userId: string | null = null
    let codeVerifier: string | null = null
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString())
        userId = decodedState.userId
        codeVerifier = decodedState.codeVerifier
      } catch (e) {
        console.error('[QuickBooks OAuth Callback] Invalid state parameter')
      }
    }

    // Get user from session if state is missing
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(new URL('/auth/login?error=unauthorized', req.url))
    }

    const finalUserId = userId || user.id
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/quickbooks/callback`
    const clientId = process.env.QUICKBOOKS_CLIENT_ID
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('[QuickBooks OAuth Callback] Missing QuickBooks OAuth credentials')
      return NextResponse.redirect(new URL('/integrations?error=oauth_not_configured', req.url))
    }

    if (!codeVerifier) {
      console.error('[QuickBooks OAuth Callback] Missing code verifier for PKCE')
      return NextResponse.redirect(new URL('/integrations?error=missing_code_verifier', req.url))
    }

    console.log('[QuickBooks OAuth Callback] Exchanging code for tokens...')
    
    // QuickBooks requires Basic Auth with client_id:client_secret
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('[QuickBooks OAuth Callback] Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/integrations?error=token_exchange_failed', req.url))
    }

    const tokenData = await tokenResponse.json()
    console.log('[QuickBooks OAuth Callback] Tokens received successfully')

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
          provider: 'quickbooks',
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
      console.error('[QuickBooks OAuth Callback] Error storing tokens in oauth_tokens:', insertError)
      return NextResponse.redirect(new URL('/integrations?error=token_storage_failed', req.url))
    }

    // Store in integration_tokens table with realmId
    await supabaseAdmin
      .from('integration_tokens')
      .upsert(
        {
          user_id: finalUserId,
          integration_type: 'quickbooks',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expires_at: expiresAt,
          scopes: ['com.intuit.quickbooks.accounting'],
          metadata: {
            realm_id: realmId || null, // QuickBooks company ID
            token_type: tokenData.token_type,
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
          console.error('[QuickBooks OAuth Callback] Error storing token in integration_tokens:', error)
        } else {
          console.log('[QuickBooks OAuth Callback] QuickBooks token stored successfully')
        }
      })

    // Redirect to integrations page with success message
    return NextResponse.redirect(new URL('/integrations?connected=quickbooks', req.url))
  } catch (err: any) {
    console.error('[QuickBooks OAuth Callback] Unexpected error:', err)
    return NextResponse.redirect(new URL(`/integrations?error=${encodeURIComponent(err.message || 'unexpected_error')}`, req.url))
  }
}

