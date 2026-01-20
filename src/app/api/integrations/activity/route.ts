import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/integrations/activity
 * Get recent integration activity/triggers for proactive agent system
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const integration = searchParams.get('integration') // Optional filter by integration

    // Query events table for integration-triggered events
    let query = supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: false })
      .limit(limit)

    // Filter by integration if specified
    if (integration) {
      query = query.eq('event_source', integration)
    }

    // Only show events from integrations (not internal events like roadmap updates)
    const integrationSources = ['slack', 'gmail', 'google-calendar', 'google_calendar', 'calendly', 'stripe', 'github', 'notion', 'discord', 'zoom', 'typeform', 'asana', 'github', 'jira', 'intercom', 'zendesk', 'mailchimp', 'hubspot']
    query = query.in('event_source', integrationSources)

    const { data: events, error } = await query

    if (error) {
      console.error('[Integration Activity] Error fetching events:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get agent tasks that might be related to these events
    const eventIds = events?.map(e => e.id) || []
    let agentTasksQuery = supabase
      .from('agent_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: agentTasks } = await agentTasksQuery

    // Format response with integration icons and metadata
    const activity = (events || []).map((event: any) => {
      const integrationIcon = getIntegrationIcon(event.event_source)
      const severityColor = getSeverityColor(event.severity)

      return {
        id: event.id,
        type: event.event_type,
        source: event.event_source,
        integrationIcon,
        severity: event.severity,
        severityColor,
        title: event.title,
        description: event.description,
        metadata: event.metadata || {},
        detectedAt: event.detected_at,
        processedAt: event.processed_at,
        // Check if there's a related agent task
        relatedAgentTask: agentTasks?.find((task: any) => 
          task.input?.event_id === event.id || 
          task.output?.event_id === event.id ||
          JSON.stringify(task.input || {}).includes(event.id) ||
          JSON.stringify(task.output || {}).includes(event.id)
        ) || null
      }
    })

    return NextResponse.json({
      activity,
      count: activity.length
    })
  } catch (error: any) {
    console.error('[Integration Activity] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch integration activity' },
      { status: 500 }
    )
  }
}

function getIntegrationIcon(source: string): string {
  const icons: Record<string, string> = {
    'slack': '💬',
    'gmail': '📧',
    'google-calendar': '📅',
    'google_calendar': '📅',
    'calendly': '🗓️',
    'stripe': '💳',
    'github': '🐙',
    'notion': '📝',
    'discord': '🎮',
    'zoom': '🎥',
    'typeform': '📝',
    'asana': '✓',
    'jira': '🔷',
    'intercom': '💬',
    'zendesk': '🎫',
    'mailchimp': '🐵',
    'hubspot': '🧲',
    'twitter': '🐦',
    'linkedin': '💼',
  }
  return icons[source.toLowerCase()] || '🔌'
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    'urgent': 'text-red-600 bg-red-100',
    'important': 'text-orange-600 bg-orange-100',
    'info': 'text-blue-600 bg-blue-100',
    'low': 'text-zinc-600 bg-zinc-100',
  }
  return colors[severity] || colors['info']
}

