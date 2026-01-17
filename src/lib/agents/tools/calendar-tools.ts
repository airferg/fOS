/**
 * Google Calendar Tools
 * Wraps Calendar API as callable tools for agentic AI
 */

import { toolRegistry } from './tool-registry'
import { getIntegrationToken } from '@/lib/integrations/integration-monitor'

// Tool: Check Calendar for upcoming events
toolRegistry.register({
  id: 'check_calendar',
  name: 'Check Calendar',
  description: 'Fetches calendar events from Google Calendar within a specified time range. Always provide timeMin and timeMax as ISO datetime strings. Calculate dates based on the current date - if user asks for "next year", calculate 365 days from now. Defaults: timeMin=now, timeMax=7 days from now.',
  parameters: {
    type: 'object',
    properties: {
      timeMin: {
        type: 'string',
        description: 'ISO datetime string for start of time range (e.g., "2024-01-15T00:00:00Z"). Calculate from current date. Default: current time.'
      },
      timeMax: {
        type: 'string',
        description: 'ISO datetime string for end of time range (e.g., "2024-12-31T23:59:59Z"). Calculate from current date based on user\'s request. For "next year" use 365 days from now. Default: 7 days from now.'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of events to return (default: 10, increase for longer time ranges)'
      }
    },
    required: []
  },
  execute: async (params: any, userId: string) => {
    const token = await getIntegrationToken(userId, 'google_calendar')
    if (!token) {
      // Return a helpful error that the AI can understand and work around
      return {
        error: 'Google Calendar not connected',
        message: 'Google Calendar integration is not connected. Please connect it in Settings > Integrations to use this feature.',
        connected: false
      }
    }

    const now = new Date()
    const timeMin = params.timeMin || now.toISOString()
    const timeMax = params.timeMax || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const maxResults = params.maxResults || 10

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`
          }
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Google Calendar token expired. Please reconnect.')
        }
        throw new Error(`Calendar API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        events: (data.items || []).map((event: any) => ({
          id: event.id,
          summary: event.summary || 'Untitled Event',
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
          description: event.description,
          attendees: event.attendees?.map((a: any) => ({
            email: a.email,
            displayName: a.displayName,
            responseStatus: a.responseStatus
          })) || []
        })),
        count: data.items?.length || 0
      }
    } catch (error: any) {
      throw new Error(`Failed to check calendar: ${error.message}`)
    }
  }
})

// Tool: Get specific meeting details
toolRegistry.register({
  id: 'get_meeting_details',
  name: 'Get Meeting Details',
  description: 'Gets detailed information about a specific calendar event by its ID. Use this after checking calendar to get full details of a meeting.',
  parameters: {
    type: 'object',
    properties: {
      eventId: {
        type: 'string',
        description: 'The calendar event ID (from check_calendar results)'
      }
    },
    required: ['eventId']
  },
  execute: async (params: any, userId: string) => {
    const token = await getIntegrationToken(userId, 'google_calendar')
    if (!token) {
      // Return a helpful error that the AI can understand and work around
      return {
        error: 'Google Calendar not connected',
        message: 'Google Calendar integration is not connected. Please connect it in Settings > Integrations to use this feature.',
        connected: false
      }
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${params.eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`
          }
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Google Calendar token expired. Please reconnect.')
        }
        throw new Error(`Calendar API error: ${response.statusText}`)
      }

      const event = await response.json()
      return {
        id: event.id,
        summary: event.summary || 'Untitled Event',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        description: event.description,
        attendees: event.attendees?.map((a: any) => ({
          email: a.email,
          displayName: a.displayName,
          responseStatus: a.responseStatus
        })) || [],
        htmlLink: event.htmlLink,
        hangoutLink: event.hangoutLink
      }
    } catch (error: any) {
      throw new Error(`Failed to get meeting details: ${error.message}`)
    }
  }
})

// Tool: Create calendar event
toolRegistry.register({
  id: 'create_calendar_event',
  name: 'Create Calendar Event',
  description: 'Creates a new calendar event in Google Calendar. Use this to schedule meetings or reminders.',
  parameters: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'Event title/summary'
      },
      description: {
        type: 'string',
        description: 'Event description/details'
      },
      startTime: {
        type: 'string',
        description: 'ISO datetime string for event start time'
      },
      endTime: {
        type: 'string',
        description: 'ISO datetime string for event end time'
      },
      location: {
        type: 'string',
        description: 'Event location (optional)'
      },
      attendees: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of attendee email addresses (optional)'
      }
    },
    required: ['summary', 'startTime', 'endTime']
  },
  execute: async (params: any, userId: string) => {
    const token = await getIntegrationToken(userId, 'google_calendar')
    if (!token) {
      // Return a helpful error that the AI can understand and work around
      return {
        error: 'Google Calendar not connected',
        message: 'Google Calendar integration is not connected. Please connect it in Settings > Integrations to use this feature.',
        connected: false
      }
    }

    try {
      const eventData: any = {
        summary: params.summary,
        description: params.description || '',
        start: {
          dateTime: params.startTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: params.endTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }

      if (params.location) {
        eventData.location = params.location
      }

      if (params.attendees && params.attendees.length > 0) {
        eventData.attendees = params.attendees.map((email: string) => ({ email }))
      }

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Google Calendar token expired. Please reconnect.')
        }
        throw new Error(`Calendar API error: ${response.statusText}`)
      }

      const event = await response.json()
      return {
        id: event.id,
        summary: event.summary,
        start: event.start?.dateTime,
        end: event.end?.dateTime,
        htmlLink: event.htmlLink,
        hangoutLink: event.hangoutLink
      }
    } catch (error: any) {
      throw new Error(`Failed to create calendar event: ${error.message}`)
    }
  }
})

