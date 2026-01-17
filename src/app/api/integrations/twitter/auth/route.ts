import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import crypto from 'crypto'

/**
 * Initiate Twitter/X OAuth flow
 * GET /api/integrations/twitter/auth
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/twitter/callback`
    const clientId = process.env.TWITTER_CLIENT_ID

    if (!clientId) {
      return NextResponse.json({ error: 'Twitter OAuth not configured' }, { status: 500 })
    }

    // Generate state and code verifier for PKCE (required for Twitter OAuth 2.0)
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
    const state = Buffer.from(JSON.stringify({ userId: user.id, codeVerifier })).toString('base64')

    // Build Twitter OAuth URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`

    return NextResponse.json({ url: authUrl, state })
  } catch (error: any) {
    console.error('[Twitter OAuth] Initiation error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

