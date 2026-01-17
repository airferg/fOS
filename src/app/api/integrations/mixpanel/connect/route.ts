import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Store Mixpanel API key and project ID
 * POST /api/integrations/mixpanel/connect
 * Body: { api_key: string, project_id?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { api_key, project_id } = await req.json()

    if (!api_key) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    // Store in oauth_tokens table
    await supabaseAdmin
      .from('oauth_tokens')
      .upsert(
        {
          user_id: user.id,
          provider: 'mixpanel',
          access_token: api_key, // Store API key as access_token
          refresh_token: null,
          expires_at: null, // Mixpanel API keys don't expire
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )

    // Store in integration_tokens table with project_id in metadata
    await supabaseAdmin
      .from('integration_tokens')
      .upsert(
        {
          user_id: user.id,
          integration_type: 'mixpanel',
          access_token: api_key,
          refresh_token: null,
          token_expires_at: null,
          scopes: ['read', 'write'],
          metadata: {
            project_id: project_id || null,
          },
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,integration_type',
        }
      )

    return NextResponse.json({ success: true, message: 'Mixpanel API key stored successfully' })
  } catch (error: any) {
    console.error('[Mixpanel Connect] Error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

