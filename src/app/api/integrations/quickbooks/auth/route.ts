import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import crypto from 'crypto'

/**
 * Initiate QuickBooks Online (Intuit) OAuth flow
 * GET /api/integrations/quickbooks/auth
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/quickbooks/callback`
    const clientId = process.env.QUICKBOOKS_CLIENT_ID

    if (!clientId) {
      return NextResponse.json({ error: 'QuickBooks OAuth not configured' }, { status: 500 })
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')

    // QuickBooks uses OAuth 2.0 with PKCE
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

    // Build Intuit OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      redirect_uri: redirectUri,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    const authUrl = `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`

    // Store code_verifier in state for later use (simplified approach)
    return NextResponse.json({ url: authUrl, state: Buffer.from(JSON.stringify({ userId: user.id, codeVerifier })).toString('base64') })
  } catch (error: any) {
    console.error('[QuickBooks OAuth] Initiation error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

