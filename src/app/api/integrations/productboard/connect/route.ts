import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Store Productboard Personal Access Token
 * POST /api/integrations/productboard/connect
 * Body: { access_token: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { access_token } = await req.json()

    if (!access_token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    // Store in oauth_tokens table
    await supabaseAdmin
      .from('oauth_tokens')
      .upsert(
        {
          user_id: user.id,
          provider: 'productboard',
          access_token: access_token,
          refresh_token: null,
          expires_at: null, // Productboard PATs don't expire
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,provider',
        }
      )

    // Store in integration_tokens table
    await supabaseAdmin
      .from('integration_tokens')
      .upsert(
        {
          user_id: user.id,
          integration_type: 'productboard',
          access_token: access_token,
          refresh_token: null,
          token_expires_at: null,
          scopes: ['read', 'write'],
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,integration_type',
        }
      )

    return NextResponse.json({ success: true, message: 'Productboard token stored successfully' })
  } catch (error: any) {
    console.error('[Productboard Connect] Error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

