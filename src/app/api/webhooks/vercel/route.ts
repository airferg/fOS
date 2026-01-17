import { NextRequest, NextResponse } from 'next/server'

/**
 * Handle Vercel webhook events
 * POST /api/webhooks/vercel
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log('[Vercel Webhook] Event received:', { 
      type: body.type,
      payload: body.payload 
    })

    // Handle deployment events
    if (body.type === 'deployment.created' || body.type === 'deployment.ready' || body.type === 'deployment.error') {
      console.log('[Vercel Webhook] Deployment event:', {
        type: body.type,
        deployment: {
          id: body.payload?.deployment?.id,
          url: body.payload?.deployment?.url,
          state: body.payload?.deployment?.state,
        },
        project: body.payload?.project?.name,
      })

      // TODO: Process deployment event
      // You can save to database, trigger actions, send notifications, etc.
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Vercel Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

