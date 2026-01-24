import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { detectAllEvents } from '@/lib/proactive/event-detector'
import { processEvents } from '@/lib/proactive/proactive-engine'

/**
 * Background job endpoint for proactive checks
 * Can be called by:
 * - Vercel Cron Jobs
 * - External cron service (cron-job.org, etc.)
 * - Manual trigger
 * 
 * GET /api/cron/proactive-check
 * Headers: Authorization: Bearer <cron-secret>
 */
export async function GET(req: NextRequest) {
  console.log('[Cron: Proactive Check] ===== CRON JOB STARTED =====')
  console.log('[Cron: Proactive Check] Time:', new Date().toISOString())
  
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('onboarding_complete', true)
      .limit(100) // Process in batches

    if (usersError || !users) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const results = []

    // Process each user
    for (const user of users) {
      try {
        // Detect events
        const events = await detectAllEvents(user.id)

        // Process events into proactive messages
        const messages = await processEvents(user.id)

        results.push({
          userId: user.id,
          eventsDetected: events.length,
          messagesGenerated: messages.length
        })
      } catch (error: any) {
        console.error(`Error processing user ${user.id}:`, error)
        results.push({
          userId: user.id,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      usersProcessed: results.length,
      results
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

