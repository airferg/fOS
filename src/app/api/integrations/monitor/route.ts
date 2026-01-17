/**
 * Integration Monitoring Endpoint
 * Runs monitoring jobs for all active integrations
 * Called by background cron jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { getJobsToRun, updateMonitoringJob } from '@/lib/integrations/integration-monitor'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { detectAllEvents } from '@/lib/proactive/event-detector'
import { processEvents } from '@/lib/proactive/proactive-engine'

export async function GET(req: NextRequest) {
  try {
    // Check for cron secret (optional security)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all jobs that need to run
    const jobs = await getJobsToRun()

    const results = []

    for (const job of jobs) {
      try {
        // Update job status to running
        await updateMonitoringJob(job.id, { status: 'running', last_run_at: new Date() })

        // Run event detection for this user
        const events = await detectAllEvents(job.user_id)

        // Process events into proactive messages (use admin client for cron jobs)
        const messages = await processEvents(job.user_id, supabaseAdmin)

        // Calculate next run time
        const nextRunAt = new Date(Date.now() + job.run_interval_minutes * 60 * 1000)

        // Update job as completed
        await updateMonitoringJob(job.id, {
          status: 'completed',
          next_run_at: nextRunAt,
          metadata: {
            eventsDetected: events.length,
            messagesGenerated: messages.length,
            lastRun: new Date().toISOString(),
          },
        })

        results.push({
          jobId: job.id,
          userId: job.user_id,
          integrationType: job.integration_type,
          eventsDetected: events.length,
          messagesGenerated: messages.length,
          status: 'success',
        })
      } catch (error: any) {
        console.error(`Error running monitoring job ${job.id}:`, error)

        // Update job as failed
        await updateMonitoringJob(job.id, {
          status: 'failed',
          error_message: error.message,
        })

        results.push({
          jobId: job.id,
          userId: job.user_id,
          integrationType: job.integration_type,
          status: 'failed',
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      jobsProcessed: jobs.length,
      results,
    })
  } catch (error: any) {
    console.error('Integration monitoring error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

