/**
 * Google Calendar Integration Monitor
 * Monitors calendar for upcoming meetings, conflicts, and preparation needs
 */

import { getIntegrationToken } from './integration-monitor'
import { DetectedEvent } from '@/lib/proactive/event-detector'

/**
 * Monitor Google Calendar for events
 */
export async function monitorCalendar(userId: string): Promise<DetectedEvent[]> {
  console.log(`[Calendar Monitor] 📅 Monitoring calendar for user ${userId}...`)
  const events: DetectedEvent[] = []

  // Get Calendar integration token
  const token = await getIntegrationToken(userId, 'google_calendar')
  if (!token) {
    console.log(`[Calendar Monitor] ⚠️  Google Calendar not connected for user ${userId}. Skipping monitoring.`)
    return events
  }
  
  console.log(`[Calendar Monitor] ✅ Calendar connected, checking for upcoming events...`)

  try {
    // Fetch upcoming events
    console.log(`[Calendar Monitor] 📆 Fetching upcoming calendar events...`)
    const upcomingEvents = await fetchUpcomingEvents(token.access_token)
    console.log(`[Calendar Monitor] 📆 Found ${upcomingEvents.length} upcoming event(s)`)

    // Check for meetings in next 24 hours
    const tomorrowEvents = upcomingEvents.filter((event: any) => {
      const startTime = new Date(event.start?.dateTime || event.start?.date)
      const now = new Date()
      const hoursUntil = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      return hoursUntil > 0 && hoursUntil <= 24
    })

    if (tomorrowEvents.length > 0) {
      console.log(`[Calendar Monitor] ⏰ Found ${tomorrowEvents.length} meeting(s) in next 24 hours`)
      for (const event of tomorrowEvents) {
        const startTime = new Date(event.start?.dateTime || event.start?.date)
        const hoursUntil = (startTime.getTime() - Date.now()) / (1000 * 60 * 60)

        events.push({
          eventType: 'calendar_event',
          eventSource: 'google_calendar',
          severity: hoursUntil < 2 ? 'urgent' : 'important',
          title: `Upcoming: ${event.summary || 'Meeting'}`,
          description: `You have a meeting "${event.summary || 'Untitled'}" ${formatTimeUntil(startTime)}.`,
          metadata: {
            eventId: event.id,
            summary: event.summary,
            startTime: event.start?.dateTime || event.start?.date,
            location: event.location,
            attendees: event.attendees?.map((a: any) => a.email) || [],
            hoursUntil,
          },
        })
      }
    }

    // Check for conflicts (overlapping events)
    const conflicts = detectConflicts(upcomingEvents)
    if (conflicts.length > 0) {
      console.log(`[Calendar Monitor] ⚠️  Found ${conflicts.length} calendar conflict(s)`)
      events.push({
        eventType: 'calendar_event',
        eventSource: 'google_calendar',
        severity: 'urgent',
        title: 'Calendar Conflict Detected',
        description: `You have ${conflicts.length} overlapping event(s) in your calendar.`,
        metadata: {
          conflicts,
        },
      })
    }
  } catch (error: any) {
    console.error(`[Calendar Monitor] ❌ Error monitoring Google Calendar for user ${userId}:`, error.message)
    // Don't throw - just return empty events
  }

  return events
}

/**
 * Fetch upcoming events from Google Calendar API
 */
async function fetchUpcomingEvents(accessToken: string): Promise<any[]> {
  try {
    const now = new Date()
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const timeMin = now.toISOString()
    const timeMax = oneWeekLater.toISOString()

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Calendar token expired')
      }
      throw new Error(`Calendar API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return []
  }
}

/**
 * Detect overlapping events
 */
function detectConflicts(events: any[]): any[] {
  const conflicts: any[] = []

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i]
      const event2 = events[j]

      const start1 = new Date(event1.start?.dateTime || event1.start?.date)
      const end1 = new Date(event1.end?.dateTime || event1.end?.date)
      const start2 = new Date(event2.start?.dateTime || event2.start?.date)
      const end2 = new Date(event2.end?.dateTime || event2.end?.date)

      // Check if events overlap
      if (start1 < end2 && start2 < end1) {
        conflicts.push({
          event1: { id: event1.id, summary: event1.summary, start: start1, end: end1 },
          event2: { id: event2.id, summary: event2.summary, start: start2, end: end2 },
        })
      }
    }
  }

  return conflicts
}

/**
 * Format time until event
 */
function formatTimeUntil(date: Date): string {
  const now = new Date()
  const hoursUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntil < 1) {
    const minutes = Math.floor(hoursUntil * 60)
    return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`
  } else if (hoursUntil < 24) {
    const hours = Math.floor(hoursUntil)
    return `in ${hours} hour${hours !== 1 ? 's' : ''}`
  } else {
    const days = Math.floor(hoursUntil / 24)
    return `in ${days} day${days !== 1 ? 's' : ''}`
  }
}

