import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Store Coda Personal Access Token
 * POST /api/integrations/coda/connect
 * Body: { access_token: string, doc_id?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { access_token, doc_id } = await req.json()

    if (!access_token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    // Store in oauth_tokens table
    await supabaseAdmin
      .from('oauth_tokens')
      .upsert(
        {
          user_id: user.id,
          provider: 'coda',
          access_token: access_token,
          refresh_token: null,
          expires_at: null, // Coda PATs don't expire
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )

    // Store in integration_tokens table with doc_id in metadata
    await supabaseAdmin
      .from('integration_tokens')
      .upsert(
        {
          user_id: user.id,
          integration_type: 'coda',
          access_token: access_token,
          refresh_token: null,
          token_expires_at: null,
          scopes: ['read', 'write'],
          metadata: {
            doc_id: doc_id || null,
          },
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,integration_type',
        }
      )

    return NextResponse.json({ success: true, message: 'Coda token stored successfully' })
  } catch (error: any) {
    console.error('[Coda Connect] Error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

