import { NextRequest, NextResponse } from 'next/server'

/**
 * Handle Typeform webhook events
 * POST /api/webhooks/typeform
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log('[Typeform Webhook] Event received:', { 
      event_id: body.event_id,
      event_type: body.event_type,
      form_response: body.form_response 
    })

    // Handle form response events
    if (body.event_type === 'form_response' && body.form_response) {
      console.log('[Typeform Webhook] Form response:', {
        form_id: body.form_response.form_id,
        token: body.form_response.token,
        submitted_at: body.form_response.submitted_at,
        answers: body.form_response.answers,
      })

      // TODO: Process form response
      // You can save to database, trigger actions, send notifications, etc.
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Typeform Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

