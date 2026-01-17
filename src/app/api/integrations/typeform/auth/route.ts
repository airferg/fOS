import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Initiate Typeform OAuth flow
 * GET /api/integrations/typeform/auth
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/typeform/callback`
    const clientId = process.env.TYPEFORM_CLIENT_ID

    if (!clientId) {
      return NextResponse.json({ error: 'Typeform OAuth not configured' }, { status: 500 })
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')

    // Build Typeform OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'forms:read responses:read',
      state: state,
    })

    const authUrl = `https://api.typeform.com/oauth/authorize?${params.toString()}`

    return NextResponse.json({ url: authUrl })
  } catch (error: any) {
    console.error('[Typeform OAuth] Initiation error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

