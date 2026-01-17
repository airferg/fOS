import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getConnectedIntegrations } from '@/lib/integrations/integration-monitor'

/**
 * Get integration connection status for current user
 * GET /api/integrations/status
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get connected integrations
    const connected = await getConnectedIntegrations(user.id)

    // Map to integration IDs used in the UI
    const status: Record<string, boolean> = {
      'gmail': connected.has('gmail'),
      'google-calendar': connected.has('google_calendar') || connected.has('google-calendar'),
      'google-docs': connected.has('google_docs') || connected.has('google-docs'),
      'outlook': connected.has('outlook'),
      'slack': connected.has('slack'),
      'discord': connected.has('discord'),
      'zoom': connected.has('zoom'),
      'calendly': connected.has('calendly'),
      'notion': connected.has('notion'),
      'airtable': connected.has('airtable'),
      'coda': connected.has('coda'),
      'tally': connected.has('tally'),
      'typeform': connected.has('typeform'),
      'google-forms': connected.has('google_forms') || connected.has('google-forms'),
      'productboard': connected.has('productboard'),
      'linear': connected.has('linear'),
      'jira': connected.has('jira'),
      'asana': connected.has('asana'),
      'github': connected.has('github'),
      'gitlab': connected.has('gitlab'),
      'vercel': connected.has('vercel'),
      'linkedin': connected.has('linkedin'),
      'twitter': connected.has('twitter'),
      'google-analytics': connected.has('google_analytics') || connected.has('google-analytics'),
      'stripe': connected.has('stripe'),
      'quickbooks': connected.has('quickbooks'),
      'intercom': connected.has('intercom'),
      'zendesk': connected.has('zendesk'),
      'mailchimp': connected.has('mailchimp'),
      'hubspot': connected.has('hubspot'),
      'mixpanel': connected.has('mixpanel'),
      'amplitude': connected.has('amplitude'),
    }

    return NextResponse.json({ status, connected: Array.from(connected) })
  } catch (error: any) {
    console.error('Integration status error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

