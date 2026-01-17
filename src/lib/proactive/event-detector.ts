import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Event Detection System
 * Detects changes that need user attention
 */

export interface DetectedEvent {
  eventType: string
  eventSource: string
  severity: 'urgent' | 'important' | 'info' | 'low'
  title: string
  description: string
  metadata: Record<string, any>
}

/**
 * Check for budget/fund changes
 */
export async function detectBudgetChanges(userId: string): Promise<DetectedEvent[]> {
  console.log(`[Event Detector] 💰 Checking for budget changes...`)
  const supabase = await createServerSupabaseClient()
  const events: DetectedEvent[] = []

  // Get current profile
  const { data: profile } = await supabase
    .from('users')
    .select('funds_available, budget, monthly_burn')
    .eq('id', userId)
    .single()

  if (!profile) return events

  // Check for recent Stripe webhook events (if integration exists)
  // This would be populated by webhook handlers
  const { data: recentEvents } = await supabase
    .from('events')
    .select('metadata')
    .eq('user_id', userId)
    .eq('event_type', 'budget_change')
    .eq('event_source', 'stripe')
    .order('detected_at', { ascending: false })
    .limit(1)
    .single()

  // Calculate runway (using funds_available as budget)
  const monthlyBurn = profile.monthly_burn || 10000
  const currentBudget = profile.funds_available || profile.budget || 0
  const runwayMonths = monthlyBurn > 0 ? currentBudget / monthlyBurn : 0

  // Alert if runway is low
  if (runwayMonths < 3 && runwayMonths > 0) {
    console.log(`[Event Detector] 💰 ⚠️  Low runway detected: ${runwayMonths.toFixed(1)} months`)
    events.push({
      eventType: 'budget_change',
      eventSource: 'internal',
      severity: 'urgent',
      title: 'Low Runway Alert',
      description: `You have ${runwayMonths.toFixed(1)} months of runway remaining.`,
      metadata: {
        currentBudget: currentBudget,
        monthlyBurn: monthlyBurn,
        runwayMonths: runwayMonths,
        urgency: 'high'
      }
    })
  } else {
    console.log(`[Event Detector] 💰 ✅ Budget status OK (runway: ${runwayMonths.toFixed(1)} months)`)
  }

  console.log(`[Event Detector] 💰 Found ${events.length} budget event(s)`)
  return events
}

/**
 * Check for calendar events that need attention
 */
export async function detectCalendarEvents(userId: string): Promise<DetectedEvent[]> {
  console.log(`[Event Detector] 📅 Checking for calendar events for user ${userId}...`)
  // Use the integration monitoring system
  const { monitorCalendar } = await import('@/lib/integrations/calendar-monitor')
  const events = await monitorCalendar(userId)
  console.log(`[Event Detector] 📅 Found ${events.length} calendar event(s)`)
  return events
}

/**
 * Check for roadmap updates
 */
export async function detectRoadmapUpdates(userId: string): Promise<DetectedEvent[]> {
  console.log(`[Event Detector] 🗺️  Checking for roadmap updates...`)
  const supabase = await createServerSupabaseClient()
  const events: DetectedEvent[] = []

  // Get recent roadmap changes
  const { data: recentItems } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(5)

  if (!recentItems) return events

  // Check for completed items (celebrations)
  const completedItems = recentItems.filter(item => item.status === 'done')
  const newlyCompleted = completedItems.filter(item => {
    const updatedAt = new Date(item.updated_at)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return updatedAt > oneDayAgo
  })

  for (const item of newlyCompleted) {
    events.push({
      eventType: 'roadmap_update',
      eventSource: 'internal',
      severity: 'info',
      title: `Completed: ${item.title}`,
      description: `Great progress! You completed "${item.title}".`,
      metadata: {
        roadmapItemId: item.id,
        title: item.title,
        status: item.status
      }
    })
  }

  // Check for overdue items
  const overdueItems = recentItems.filter(item => {
    if (item.status === 'done') return false
    if (!item.due_date) return false
    const dueDate = new Date(item.due_date)
    return dueDate < new Date() && item.status !== 'done'
  })

  if (overdueItems.length > 0) {
    console.log(`[Event Detector] 🗺️  ⚠️  Found ${overdueItems.length} overdue task(s)`)
    events.push({
      eventType: 'roadmap_update',
      eventSource: 'internal',
      severity: 'important',
      title: `${overdueItems.length} Overdue Task${overdueItems.length > 1 ? 's' : ''}`,
      description: `You have ${overdueItems.length} task(s) that are past due.`,
      metadata: {
        overdueCount: overdueItems.length,
        items: overdueItems.map(i => ({ id: i.id, title: i.title }))
      }
    })
  }

  if (newlyCompleted.length > 0) {
    console.log(`[Event Detector] 🗺️  🎉 Found ${newlyCompleted.length} newly completed task(s)`)
  }

  console.log(`[Event Detector] 🗺️  Found ${events.length} roadmap event(s)`)
  return events
}

/**
 * Store detected events in database
 */
export async function storeEvents(userId: string, events: DetectedEvent[]): Promise<void> {
  if (events.length === 0) {
    return
  }
  
  console.log(`[Event Detector] 💾 Storing ${events.length} event(s) to database...`)
  if (events.length === 0) return

  const supabase = await createServerSupabaseClient()

  const eventRecords = events.map(event => ({
    user_id: userId,
    event_type: event.eventType,
    event_source: event.eventSource,
    severity: event.severity,
    title: event.title,
    description: event.description,
    metadata: event.metadata
  }))

  await supabase
    .from('events')
    .insert(eventRecords)
}

/**
 * Check for email/message events
 */
export async function detectEmailEvents(userId: string): Promise<DetectedEvent[]> {
  console.log(`[Event Detector] 📧 Checking for email events for user ${userId}...`)
  // Use the integration monitoring system
  const { monitorGmail } = await import('@/lib/integrations/gmail-monitor')
  const events = await monitorGmail(userId)
  console.log(`[Event Detector] 📧 Found ${events.length} email event(s)`)
  return events
}

/**
 * Run all event detectors
 */
export async function detectAllEvents(userId: string): Promise<DetectedEvent[]> {
  const [
    budgetEvents,
    calendarEvents,
    roadmapEvents,
    emailEvents,
  ] = await Promise.all([
    detectBudgetChanges(userId),
    detectCalendarEvents(userId),
    detectRoadmapUpdates(userId),
    detectEmailEvents(userId),
  ])

  const allEvents = [...budgetEvents, ...calendarEvents, ...roadmapEvents, ...emailEvents]

  // Store events
  await storeEvents(userId, allEvents)

  return allEvents
}

