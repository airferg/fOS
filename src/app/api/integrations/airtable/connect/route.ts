import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Store Airtable Personal Access Token
 * POST /api/integrations/airtable/connect
 * Body: { access_token: string, base_id: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { access_token, base_id } = await req.json()

    if (!access_token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    // Store in oauth_tokens table
    await supabaseAdmin
      .from('oauth_tokens')
      .upsert(
        {
          user_id: user.id,
          provider: 'airtable',
          access_token: access_token,
          refresh_token: null,
          expires_at: null, // Airtable PATs don't expire
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )

    // Store in integration_tokens table with base_id in metadata
    await supabaseAdmin
      .from('integration_tokens')
      .upsert(
        {
          user_id: user.id,
          integration_type: 'airtable',
          access_token: access_token,
          refresh_token: null,
          token_expires_at: null,
          scopes: ['read', 'write'],
          metadata: {
            base_id: base_id || null,
          },
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,integration_type',
        }
      )

    return NextResponse.json({ success: true, message: 'Airtable token stored successfully' })
  } catch (error: any) {
    console.error('[Airtable Connect] Error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

