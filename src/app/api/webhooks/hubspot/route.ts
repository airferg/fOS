import { NextRequest, NextResponse } from 'next/server'

/**
 * Handle HubSpot webhook events
 * POST /api/webhooks/hubspot
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log('[HubSpot Webhook] Event received:', { 
      eventType: body.eventType,
      subscriptionId: body.subscriptionId 
    })

    // Handle contact events
    if (body.eventType === 'contact.creation' || body.eventType === 'contact.propertyChange') {
      console.log('[HubSpot Webhook] Contact event:', {
        eventType: body.eventType,
        objectId: body.objectId,
        properties: body.properties,
      })

      // TODO: Process contact event
      // You can save to database, trigger actions, send notifications, etc.
    }

    // Handle deal events
    if (body.eventType?.startsWith('deal.')) {
      console.log('[HubSpot Webhook] Deal event:', body.eventType, body.objectId)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[HubSpot Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

