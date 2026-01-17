import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Initiate Slack OAuth flow
 * GET /api/integrations/slack/auth
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/integrations/slack/callback`
    const clientId = process.env.SLACK_CLIENT_ID

    if (!clientId) {
      return NextResponse.json({ error: 'Slack OAuth not configured' }, { status: 500 })
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')

    // Build Slack OAuth URL
    // User-level scopes for sending/reading messages, checking reminders, accessing channels
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'app_mentions:read,assistant:write,channels:history,channels:read,chat:write,im:write,reminders:read,team:read,usergroups:read,usergroups:write,reminders:write',
      redirect_uri: redirectUri,
      state: state,
    })

    const authUrl = `https://slack.com/oauth/v2/authorize?${params.toString()}`

    return NextResponse.json({ url: authUrl })
  } catch (error: any) {
    console.error('[Slack OAuth] Initiation error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

