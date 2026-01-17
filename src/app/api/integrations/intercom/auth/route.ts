import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Initiate Intercom OAuth flow
 * GET /api/integrations/intercom/auth
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/intercom/callback`
    const clientId = process.env.INTERCOM_CLIENT_ID

    if (!clientId) {
      return NextResponse.json({ error: 'Intercom OAuth not configured' }, { status: 500 })
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')

    // Build Intercom OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state,
    })

    const authUrl = `https://app.intercom.com/a/oauth/connect?${params.toString()}`

    return NextResponse.json({ url: authUrl })
  } catch (error: any) {
    console.error('[Intercom OAuth] Initiation error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

