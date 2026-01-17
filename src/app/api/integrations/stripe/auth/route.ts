import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Initiate Stripe Connect OAuth flow
 * GET /api/integrations/stripe/auth
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/stripe/callback`
    const clientId = process.env.STRIPE_CLIENT_ID

    if (!clientId) {
      return NextResponse.json({ error: 'Stripe OAuth not configured' }, { status: 500 })
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')

    // Build Stripe Connect OAuth URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: 'read_write',
      redirect_uri: redirectUri,
      state: state,
    })

    const authUrl = `https://connect.stripe.com/oauth/authorize?${params.toString()}`

    return NextResponse.json({ url: authUrl })
  } catch (error: any) {
    console.error('[Stripe OAuth] Initiation error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

