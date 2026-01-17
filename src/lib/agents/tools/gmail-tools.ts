/**
 * Gmail Tools
 * Wraps Gmail API as callable tools for agentic AI
 */

import { toolRegistry } from './tool-registry'
import { getIntegrationToken } from '@/lib/integrations/integration-monitor'

// Tool: Check Gmail inbox
toolRegistry.register({
  id: 'check_gmail',
  name: 'Check Gmail',
  description: 'Fetches emails from Gmail inbox. Can filter by unread, sender, subject, etc. Use this to check for important messages or emails from specific contacts.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Gmail search query (e.g., "is:unread", "from:investor@example.com", "subject:meeting"). Default: "is:unread"'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of emails to return (default: 20)'
      }
    },
    required: []
  },
  execute: async (params: any, userId: string) => {
    const token = await getIntegrationToken(userId, 'gmail')
    if (!token) {
      // Return a helpful error that the AI can understand and work around
      return {
        error: 'Gmail not connected',
        message: 'Gmail integration is not connected. Please connect it in Settings > Integrations to use this feature.',
        connected: false
      }
    }

    const query = params.query || 'is:unread'
    const maxResults = params.maxResults || 20

    try {
      // First, get message IDs
      const listResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`
          }
        }
      )

      if (!listResponse.ok) {
        if (listResponse.status === 401) {
          throw new Error('Gmail token expired. Please reconnect.')
        }
        throw new Error(`Gmail API error: ${listResponse.statusText}`)
      }

      const listData = await listResponse.json()
      const messageIds = (listData.messages || []).slice(0, maxResults).map((m: any) => m.id)

      // Fetch full message details
      const messagePromises = messageIds.map((messageId: string) =>
        fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${token.access_token}`
            }
          }
        ).then(res => res.json())
      )

      const messages = await Promise.all(messagePromises)

      return {
        emails: messages.map((msg: any) => {
          const headers = msg.payload?.headers || []
          const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || ''

          return {
            id: msg.id,
            threadId: msg.threadId,
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            snippet: msg.snippet,
            unread: msg.labelIds?.includes('UNREAD') || false
          }
        }),
        count: messages.length
      }
    } catch (error: any) {
      throw new Error(`Failed to check Gmail: ${error.message}`)
    }
  }
})

// Tool: Send email
toolRegistry.register({
  id: 'send_email',
  name: 'Send Email',
  description: 'Sends an email via Gmail. Use this when the user explicitly asks to send an email. Always use this for sending, not draft_email, unless specifically asked to draft only.',
  parameters: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Recipient email address (or comma-separated list for multiple recipients)'
      },
      subject: {
        type: 'string',
        description: 'Email subject line'
      },
      body: {
        type: 'string',
        description: 'Email body content (plain text or HTML)'
      },
      cc: {
        type: 'string',
        description: 'CC recipients (comma-separated, optional)'
      },
      bcc: {
        type: 'string',
        description: 'BCC recipients (comma-separated, optional)'
      }
    },
    required: ['to', 'subject', 'body']
  },
  execute: async (params: any, userId: string) => {
    const token = await getIntegrationToken(userId, 'gmail')
    if (!token) {
      // Return a helpful error that the AI can understand and work around
      return {
        error: 'Gmail not connected',
        message: 'Gmail integration is not connected. Please connect it in Settings > Integrations to use this feature.',
        connected: false
      }
    }

    try {
      // Build email message
      const to = params.to.split(',').map((e: string) => e.trim()).join(',')
      const cc = params.cc ? params.cc.split(',').map((e: string) => e.trim()).join(',') : ''
      const bcc = params.bcc ? params.bcc.split(',').map((e: string) => e.trim()).join(',') : ''

      const emailLines = [
        `To: ${to}`,
        ...(cc ? [`Cc: ${cc}`] : []),
        ...(bcc ? [`Bcc: ${bcc}`] : []),
        `Subject: ${params.subject}`,
        '',
        params.body
      ]

      const email = emailLines.join('\n')

      // Encode as base64url
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      // Send the email using Gmail API
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            raw: encodedEmail
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        console.error('[Gmail Tools] Send email error:', errorData)
        if (response.status === 401) {
          throw new Error('Gmail token expired. Please reconnect.')
        }
        throw new Error(`Gmail API error: ${response.statusText}`)
      }

      const sentMessage = await response.json()
      return {
        success: true,
        id: sentMessage.id,
        threadId: sentMessage.threadId,
        messageLink: `https://mail.google.com/mail/u/0/#inbox/${sentMessage.id}`,
        message: `Email sent successfully to ${to}`
      }
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error.message}`)
    }
  }
})

// Tool: Draft email
toolRegistry.register({
  id: 'draft_email',
  name: 'Draft Email',
  description: 'Creates a draft email in Gmail. Does NOT send it - user can review and send manually. Use this only when the user specifically asks to draft an email for review, not when they ask to send an email.',
  parameters: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Recipient email address (or comma-separated list for multiple recipients)'
      },
      subject: {
        type: 'string',
        description: 'Email subject line'
      },
      body: {
        type: 'string',
        description: 'Email body content (plain text or HTML)'
      },
      cc: {
        type: 'string',
        description: 'CC recipients (comma-separated, optional)'
      },
      bcc: {
        type: 'string',
        description: 'BCC recipients (comma-separated, optional)'
      }
    },
    required: ['to', 'subject', 'body']
  },
  execute: async (params: any, userId: string) => {
    const token = await getIntegrationToken(userId, 'gmail')
    if (!token) {
      // Return a helpful error that the AI can understand and work around
      return {
        error: 'Gmail not connected',
        message: 'Gmail integration is not connected. Please connect it in Settings > Integrations to use this feature.',
        connected: false
      }
    }

    try {
      // Build email message
      const to = params.to.split(',').map((e: string) => e.trim()).join(',')
      const cc = params.cc ? params.cc.split(',').map((e: string) => e.trim()).join(',') : ''
      const bcc = params.bcc ? params.bcc.split(',').map((e: string) => e.trim()).join(',') : ''

      const emailLines = [
        `To: ${to}`,
        ...(cc ? [`Cc: ${cc}`] : []),
        ...(bcc ? [`Bcc: ${bcc}`] : []),
        `Subject: ${params.subject}`,
        '',
        params.body
      ]

      const email = emailLines.join('\n')

      // Encode as base64url
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              raw: encodedEmail
            }
          })
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Gmail token expired. Please reconnect.')
        }
        throw new Error(`Gmail API error: ${response.statusText}`)
      }

      const draft = await response.json()
      return {
        id: draft.id,
        messageId: draft.message?.id,
        threadId: draft.message?.threadId,
        draftLink: `https://mail.google.com/mail/u/0/#drafts/${draft.id}`,
        message: 'Email draft created successfully. Review and send from Gmail.'
      }
    } catch (error: any) {
      throw new Error(`Failed to create email draft: ${error.message}`)
    }
  }
})

// Tool: Lookup contact (searches both database contacts and Gmail contacts)
toolRegistry.register({
  id: 'lookup_contact',
  name: 'Lookup Contact',
  description: 'Searches for a contact by name in both your database contacts and Gmail contacts. Returns email address and name if found. Use this when the user mentions a contact name like "Kean Harrison" and you need to find their email address.',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Contact name to search for (e.g., "Kean Harrison", "John Doe")'
      }
    },
    required: ['name']
  },
  execute: async (params: any, userId: string) => {
    const { name } = params
    if (!name || !name.trim()) {
      return { error: 'Name is required', found: false }
    }

    const searchName = name.trim().toLowerCase()
    const results: Array<{ name: string; email: string; source: 'database' | 'gmail' }> = []

    try {
      // First, search database contacts
      const supabase = await import('@/lib/supabase-server').then(m => m.createServerSupabaseClient())
      const { data: dbContacts } = await supabase
        .from('contacts')
        .select('name, email')
        .eq('user_id', userId)
        .or(`name.ilike.%${searchName}%,email.ilike.%${searchName}%`)
        .limit(10)

      if (dbContacts) {
        for (const contact of dbContacts) {
          if (contact.email && contact.name) {
            const contactNameLower = contact.name.toLowerCase()
            if (contactNameLower.includes(searchName) || searchName.includes(contactNameLower.split(' ')[0]) || searchName.includes(contactNameLower.split(' ')[1] || '')) {
              results.push({
                name: contact.name,
                email: contact.email,
                source: 'database'
              })
            }
          }
        }
      }

      // If not found in database, try Gmail contacts (People API)
      if (results.length === 0) {
        const token = await getIntegrationToken(userId, 'gmail')
        if (token) {
          try {
            // Search Gmail contacts using People API
            const peopleResponse = await fetch(
              `https://people.googleapis.com/v1/people:searchContacts?query=${encodeURIComponent(name)}&readMask=names,emailAddresses&pageSize=10`,
              {
                headers: {
                  Authorization: `Bearer ${token.access_token}`
                }
              }
            )

            if (peopleResponse.ok) {
              const peopleData = await peopleResponse.json()
              const contacts = peopleData.results || []

              for (const result of contacts) {
                const person = result.person
                const names = person.names || []
                const emails = person.emailAddresses || []

                if (emails.length > 0 && names.length > 0) {
                  const contactName = names[0].displayName || names[0].givenName + ' ' + (names[0].familyName || '')
                  const email = emails[0].value

                  // Check if name matches
                  const contactNameLower = contactName.toLowerCase()
                  if (contactNameLower.includes(searchName) || searchName.includes(contactNameLower.split(' ')[0]) || searchName.includes(contactNameLower.split(' ')[1] || '')) {
                    results.push({
                      name: contactName,
                      email: email,
                      source: 'gmail'
                    })
                  }
                }
              }
            }
          } catch (gmailError: any) {
            // If Gmail contacts fail, that's okay - we'll just use database results
            console.warn('[Gmail Tools] Failed to fetch Gmail contacts:', gmailError.message)
          }
        }
      }

      if (results.length === 0) {
        return {
          found: false,
          name: name,
          message: `Contact "${name}" not found in database or Gmail contacts. You may need to add them to your network first or check the spelling.`
        }
      }

      // Return the best match (exact match preferred)
      const exactMatch = results.find(r => r.name.toLowerCase() === searchName)
      const bestMatch = exactMatch || results[0]

      return {
        found: true,
        name: bestMatch.name,
        email: bestMatch.email,
        source: bestMatch.source,
        allMatches: results.length > 1 ? results : undefined
      }
    } catch (error: any) {
      console.error('[Gmail Tools] Error looking up contact:', error)
      return {
        error: `Failed to lookup contact: ${error.message}`,
        found: false
      }
    }
  }
})

