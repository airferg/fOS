import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Initiate Zendesk OAuth flow
 * GET /api/integrations/zendesk/auth
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/zendesk/callback`
    const clientId = process.env.ZENDESK_CLIENT_ID
    const zendeskSubdomain = process.env.ZENDESK_SUBDOMAIN // e.g., "yourcompany" for yourcompany.zendesk.com

    if (!clientId || !zendeskSubdomain) {
      return NextResponse.json({ error: 'Zendesk OAuth not configured' }, { status: 500 })
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')

    // Build Zendesk OAuth URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read write',
      state: state,
    })

    const authUrl = `https://${zendeskSubdomain}.zendesk.com/oauth/authorizations/new?${params.toString()}`

    return NextResponse.json({ url: authUrl })
  } catch (error: any) {
    console.error('[Zendesk OAuth] Initiation error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

