import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Initiate Mailchimp OAuth flow
 * GET /api/integrations/mailchimp/auth
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/mailchimp/callback`
    const clientId = process.env.MAILCHIMP_CLIENT_ID

    if (!clientId) {
      return NextResponse.json({ error: 'Mailchimp OAuth not configured' }, { status: 500 })
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')

    // Build Mailchimp OAuth URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
    })

    const authUrl = `https://login.mailchimp.com/oauth2/authorize?${params.toString()}`

    return NextResponse.json({ url: authUrl })
  } catch (error: any) {
    console.error('[Mailchimp OAuth] Initiation error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

