import { NextRequest, NextResponse } from 'next/server'

/**
 * Handle Mailchimp webhook events
 * POST /api/webhooks/mailchimp
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log('[Mailchimp Webhook] Event received:', { 
      type: body.type,
      data: body.data 
    })

    // Handle subscriber events
    if (body.type === 'subscribe' || body.type === 'unsubscribe' || body.type === 'profile' || body.type === 'upemail') {
      console.log('[Mailchimp Webhook] Subscriber event:', {
        type: body.type,
        email: body.data?.email,
        list_id: body.data?.list_id,
      })

      // TODO: Process subscriber event
      // You can save to database, trigger actions, send notifications, etc.
    }

    // Handle campaign events
    if (body.type === 'campaign') {
      console.log('[Mailchimp Webhook] Campaign event:', body.data)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Mailchimp Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

