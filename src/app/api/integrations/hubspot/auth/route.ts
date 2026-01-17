import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Initiate HubSpot OAuth flow
 * GET /api/integrations/hubspot/auth
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/hubspot/callback`
    const clientId = process.env.HUBSPOT_CLIENT_ID

    if (!clientId) {
      return NextResponse.json({ error: 'HubSpot OAuth not configured' }, { status: 500 })
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')

    // Build HubSpot OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'contacts crm.objects.tasks.read crm.objects.tasks.write',
      redirect_uri: redirectUri,
      state: state,
    })

    const authUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`

    return NextResponse.json({ url: authUrl })
  } catch (error: any) {
    console.error('[HubSpot OAuth] Initiation error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

