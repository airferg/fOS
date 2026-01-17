import { NextRequest, NextResponse } from 'next/server'

/**
 * Handle Tally webhook events
 * POST /api/webhooks/tally
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log('[Tally Webhook] Event received:', { 
      event: body.event,
      form_id: body.formId,
      response_id: body.responseId 
    })

    // Handle new submission events
    if (body.event === 'response.created' || body.event === 'response.updated') {
      console.log('[Tally Webhook] Form response:', {
        form_id: body.formId,
        response_id: body.responseId,
        data: body.data,
      })

      // TODO: Process form submission
      // You can save to database, trigger actions, send notifications, etc.
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Tally Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

