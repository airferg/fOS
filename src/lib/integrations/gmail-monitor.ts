/**
 * Gmail Integration Monitor
 * Monitors Gmail for unread emails, important messages, and follow-ups needed
 */

import { getIntegrationToken } from './integration-monitor'
import { DetectedEvent } from '@/lib/proactive/event-detector'

/**
 * Monitor Gmail for events
 */
export async function monitorGmail(userId: string): Promise<DetectedEvent[]> {
  console.log(`[Gmail Monitor] 📧 Monitoring Gmail for user ${userId}...`)
  const events: DetectedEvent[] = []

  // Get Gmail integration token
  const token = await getIntegrationToken(userId, 'gmail')
  if (!token) {
    console.log(`[Gmail Monitor] ⚠️  Gmail not connected for user ${userId}. Skipping monitoring.`)
    return events
  }
  
  console.log(`[Gmail Monitor] ✅ Gmail connected, checking for new emails...`)

  try {
    // Fetch unread emails using Gmail API
    console.log(`[Gmail Monitor] 📬 Fetching unread emails...`)
    const emails = await fetchGmailMessages(token.access_token)
    console.log(`[Gmail Monitor] 📬 Found ${emails.length} unread email(s)`)

    // Detect important emails
    const importantEmails = emails.filter((email: any) => isImportantEmail(email))
    console.log(`[Gmail Monitor] ⭐ Found ${importantEmails.length} important email(s)`)

    if (importantEmails.length > 0) {
      events.push({
        eventType: 'email',
        eventSource: 'gmail',
        severity: importantEmails.length > 5 ? 'important' : 'info',
        title: `${importantEmails.length} Important Unread Email${importantEmails.length > 1 ? 's' : ''}`,
        description: `You have ${importantEmails.length} unread email(s) that may need your attention.`,
        metadata: {
          emailCount: importantEmails.length,
          emails: importantEmails.map((e: any) => ({
            id: e.id,
            from: e.from,
            subject: e.subject,
            snippet: e.snippet,
          })),
        },
      })
    }

    // Check for emails from contacts that need follow-up
    const followUpEmails = await checkFollowUpNeeded(userId, emails)
    if (followUpEmails.length > 0) {
      console.log(`[Gmail Monitor] 📬 Found ${followUpEmails.length} email(s) needing follow-up`)
      events.push({
        eventType: 'email',
        eventSource: 'gmail',
        severity: 'important',
        title: `${followUpEmails.length} Email${followUpEmails.length > 1 ? 's' : ''} Need Follow-up`,
        description: `You have ${followUpEmails.length} email(s) from contacts that haven't been responded to.`,
        metadata: {
          followUpCount: followUpEmails.length,
          emails: followUpEmails,
        },
      })
    }
  } catch (error: any) {
    console.error(`[Gmail Monitor] ❌ Error monitoring Gmail for user ${userId}:`, error.message)
    // Don't throw - just return empty events
  }

  return events
}

/**
 * Fetch unread messages from Gmail API
 */
async function fetchGmailMessages(accessToken: string): Promise<any[]> {
  try {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=20',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        throw new Error('Gmail token expired')
      }
      throw new Error(`Gmail API error: ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.messages || data.messages.length === 0) {
      return []
    }

    // Fetch full message details
    const messagePromises = data.messages.slice(0, 10).map((msg: any) =>
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((res) => res.json())
    )

    const messages = await Promise.all(messagePromises)

    return messages.map((msg) => ({
      id: msg.id,
      from: msg.payload?.headers?.find((h: any) => h.name === 'From')?.value || '',
      subject: msg.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '',
      snippet: msg.snippet || '',
      date: msg.internalDate,
    }))
  } catch (error) {
    console.error('Error fetching Gmail messages:', error)
    return []
  }
}

/**
 * Determine if an email is important
 */
function isImportantEmail(email: any): boolean {
  const importantKeywords = [
    'investor',
    'funding',
    'meeting',
    'urgent',
    'important',
    'deadline',
    'opportunity',
    'partnership',
    'customer',
    'user',
  ]

  const subject = (email.subject || '').toLowerCase()
  const snippet = (email.snippet || '').toLowerCase()
  const from = (email.from || '').toLowerCase()

  // Check if from known contacts (would need to check contacts table)
  // For now, check keywords
  const text = `${subject} ${snippet} ${from}`
  return importantKeywords.some((keyword) => text.includes(keyword))
}

/**
 * Check if emails need follow-up (from contacts, older than 2 days)
 */
async function checkFollowUpNeeded(userId: string, emails: any[]): Promise<any[]> {
  // This would check against the contacts table
  // For now, return emails older than 2 days
  const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000

  return emails.filter((email) => {
    const emailDate = parseInt(email.date) || 0
    return emailDate < twoDaysAgo
  })
}

