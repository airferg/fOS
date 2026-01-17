import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Disconnect an integration
 * DELETE /api/integrations/disconnect?provider=google
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const provider = url.searchParams.get('provider')
    const integrationType = url.searchParams.get('integration_type')

    if (!provider && !integrationType) {
      return NextResponse.json({ error: 'Provider or integration_type required' }, { status: 400 })
    }

    // Delete from oauth_tokens table
    if (provider) {
      const { error: deleteError } = await supabaseAdmin
        .from('oauth_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider)

      if (deleteError) {
        console.error('Error deleting OAuth token:', deleteError)
        return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
      }
    }

    // Delete from integration_tokens table
    if (integrationType) {
      const { error: deleteError } = await supabaseAdmin
        .from('integration_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('integration_type', integrationType)

      if (deleteError) {
        console.error('Error deleting integration token:', deleteError)
        return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
      }
    }

    // If disconnecting Google, remove all Google-related integration tokens
    if (provider === 'google') {
      const googleTypes = ['gmail', 'google_calendar', 'google_calendar', 'google_docs', 'google-docs']
      for (const type of googleTypes) {
        await supabaseAdmin
          .from('integration_tokens')
          .delete()
          .eq('user_id', user.id)
          .eq('integration_type', type)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Disconnect error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

