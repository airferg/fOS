import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Store Amplitude API key and secret
 * POST /api/integrations/amplitude/connect
 * Body: { api_key: string, api_secret: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { api_key, api_secret } = await req.json()

    if (!api_key || !api_secret) {
      return NextResponse.json({ error: 'API key and secret are required' }, { status: 400 })
    }

    // Store in oauth_tokens table
    await supabaseAdmin
      .from('oauth_tokens')
      .upsert(
        {
          user_id: user.id,
          provider: 'amplitude',
          access_token: api_key, // Store API key as access_token
          refresh_token: api_secret, // Store secret as refresh_token (for convenience)
          expires_at: null, // Amplitude API keys don't expire
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )

    // Store in integration_tokens table with secret in metadata
    await supabaseAdmin
      .from('integration_tokens')
      .upsert(
        {
          user_id: user.id,
          integration_type: 'amplitude',
          access_token: api_key,
          refresh_token: api_secret,
          token_expires_at: null,
          scopes: ['read', 'write'],
          metadata: {
            api_secret: api_secret,
          },
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,integration_type',
        }
      )

    return NextResponse.json({ success: true, message: 'Amplitude API credentials stored successfully' })
  } catch (error: any) {
    console.error('[Amplitude Connect] Error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

