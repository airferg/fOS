import { NextRequest, NextResponse } from 'next/server'
import { processWebhookEvent } from '@/lib/integrations/webhook-event-handler'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Handle Slack webhook events
 * POST /api/webhooks/slack
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log('[Slack Webhook] Event received:', { type: body.type, event_type: body.event?.type })

    // Slack URL verification challenge (for Events API subscription)
    if (body.type === 'url_verification') {
      console.log('[Slack Webhook] URL verification challenge received')
      return NextResponse.json({ challenge: body.challenge })
    }

    // Handle event callback
    if (body.type === 'event_callback' && body.event) {
      const event = body.event
      
      // Get user ID from team_id or event.team
      // Note: You'll need to map Slack team_id to your user_id
      // This is typically stored when the user connects Slack integration
      const teamId = body.team_id || event.team
      
      // Find user by Slack team_id (stored in integration_tokens metadata)
      const { data: tokenData } = await supabaseAdmin
        .from('integration_tokens')
        .select('user_id, metadata')
        .eq('integration_type', 'slack')
        .contains('metadata', { team_id: teamId })
        .eq('is_active', true)
        .maybeSingle()
      
      if (!tokenData) {
        console.log('[Slack Webhook] No user found for team_id:', teamId)
        return NextResponse.json({ ok: true }) // Return success to avoid retries
      }

      const userId = tokenData.user_id
      
      // Handle message events
      if (event.type === 'message' && event.subtype !== 'bot_message') {
        console.log('[Slack Webhook] Processing message event for user:', userId)
        
        await processWebhookEvent(
          userId,
          'slack',
          'message',
          {
            channel: event.channel,
            user: event.user,
            text: event.text,
            ts: event.ts,
            channel_type: event.channel_type,
          }
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Slack Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

