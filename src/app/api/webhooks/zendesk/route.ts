import { NextRequest, NextResponse } from 'next/server'

/**
 * Handle Zendesk webhook events
 * POST /api/webhooks/zendesk
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log('[Zendesk Webhook] Event received:', { 
      event_type: body.event_type,
      ticket_id: body.ticket?.id 
    })

    // Handle ticket events
    if (body.event_type === 'ticket.created' || body.event_type === 'ticket.updated') {
      console.log('[Zendesk Webhook] Ticket event:', {
        event_type: body.event_type,
        ticket_id: body.ticket?.id,
        subject: body.ticket?.subject,
        status: body.ticket?.status,
        priority: body.ticket?.priority,
      })

      // TODO: Process ticket event
      // You can save to database, trigger actions, send notifications, etc.
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Zendesk Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

