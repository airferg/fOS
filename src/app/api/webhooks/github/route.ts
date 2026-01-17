import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Handle GitHub webhook events
 * POST /api/webhooks/github
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-hub-signature-256')
    const event = req.headers.get('x-github-event')
    
    console.log('[GitHub Webhook] Event received:', { 
      event,
      hasSignature: !!signature 
    })

    // Verify webhook signature (required for GitHub)
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const computedSignature = `sha256=${crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')}`
      
      if (computedSignature !== signature) {
        console.error('[GitHub Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)

    // Handle issues events
    if (event === 'issues') {
      console.log('[GitHub Webhook] Issue event:', {
        action: payload.action,
        issue: {
          number: payload.issue?.number,
          title: payload.issue?.title,
          state: payload.issue?.state,
        },
        repository: payload.repository?.full_name,
      })

      // TODO: Process issue event
      // You can save to database, trigger actions, send notifications, etc.
    }

    // Handle pull request events
    if (event === 'pull_request') {
      console.log('[GitHub Webhook] Pull request event:', {
        action: payload.action,
        pull_request: {
          number: payload.pull_request?.number,
          title: payload.pull_request?.title,
          state: payload.pull_request?.state,
        },
        repository: payload.repository?.full_name,
      })

      // TODO: Process pull request event
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[GitHub Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

