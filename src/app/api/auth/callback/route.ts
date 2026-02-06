import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')
  const next = url.searchParams.get('next') || '/dashboard'

  console.log('[OAuth Callback] Received callback:', {
    hasCode: !!code,
    hasError: !!error,
    error,
    errorDescription,
    url: req.url
  })

  // Check for OAuth errors
  if (error) {
    console.error('[OAuth Callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(errorDescription || error)}`, req.url))
  }

  if (!code) {
    console.error('[OAuth Callback] No code parameter in callback URL')
    return NextResponse.redirect(new URL('/auth/login?error=no_code', req.url))
  }

  try {
    const supabase = await createServerSupabaseClient()
    
    console.log('[OAuth Callback] Exchanging code for session...')
    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[OAuth Callback] Code exchange error:', exchangeError)
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, req.url))
    }

    if (!data.user) {
      console.error('[OAuth Callback] No user in session data')
      return NextResponse.redirect(new URL('/auth/login?error=no_user', req.url))
    }

    console.log('[OAuth Callback] Code exchanged successfully. User:', {
      id: data.user.id,
      email: data.user.email,
      metadata: data.user.user_metadata
    })

    // Try to extract and store Google OAuth tokens if available
    // Note: Supabase Auth may not expose provider tokens directly
    // This is a workaround - in production, you'd need a separate OAuth flow for API access
    if (data.session?.provider_token && data.session?.provider_refresh_token) {
      console.log('[OAuth Callback] Found provider tokens in session, storing...')
      try {
        // Store in oauth_tokens table
        const { error: tokenError } = await supabaseAdmin.from('oauth_tokens').upsert({
          user_id: data.user.id,
          provider: 'google',
          access_token: data.session.provider_token,
          refresh_token: data.session.provider_refresh_token,
          expires_at: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        })

        if (tokenError) {
          console.error('[OAuth Callback] Error storing OAuth token:', tokenError)
        } else {
          console.log('[OAuth Callback] OAuth token stored successfully')
        }
      } catch (err: any) {
        console.error('[OAuth Callback] Error storing tokens:', err)
      }
    } else {
      console.log('[OAuth Callback] No provider tokens found in session (this is normal - Supabase Auth may not expose them)')
    }

    // Use admin client to check/create user profile

    console.log('[OAuth Callback] Checking for existing user profile...')
    // Check if user profile exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected for new users
      console.error('[OAuth Callback] Error checking profile:', profileError)
    }

    // Create profile if doesn't exist
    if (!profile) {
      console.log('[OAuth Callback] Creating new user profile...')
      const userName = data.user.user_metadata?.full_name || 
                      data.user.user_metadata?.name || 
                      data.user.user_metadata?.email?.split('@')[0] ||
                      'User'

      const { error: insertError } = await supabaseAdmin.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        name: userName,
        onboarding_complete: false,
      })

      if (insertError) {
        console.error('[OAuth Callback] Error creating profile:', insertError)
        // Continue anyway - user is authenticated, just profile creation failed
      } else {
        console.log('[OAuth Callback] User profile created successfully')
      }

      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    console.log('[OAuth Callback] User profile exists. Redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  } catch (err: any) {
    console.error('[OAuth Callback] Unexpected error:', err)
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(err.message || 'unexpected_error')}`, req.url))
  }
}
