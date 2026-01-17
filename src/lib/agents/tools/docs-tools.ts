/**
 * Google Docs Tools
 * Wraps Google Docs API as callable tools for agentic AI
 */

import { toolRegistry } from './tool-registry'
import { getIntegrationToken } from '@/lib/integrations/integration-monitor'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Tool: Create Google Doc
toolRegistry.register({
  id: 'create_google_doc',
  name: 'Create Google Doc',
  description: 'Creates a new Google Doc with the specified title and content. Use this to create documents, meeting notes, templates, etc.',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Document title'
      },
      content: {
        type: 'string',
        description: 'Document content to insert (plain text)'
      }
    },
    required: ['title', 'content']
  },
  execute: async (params: any, userId: string) => {
    // Try to get Google Docs token (might be stored as 'google' or 'google_docs')
    let token = await getIntegrationToken(userId, 'google_docs')
    if (!token) {
      token = await getIntegrationToken(userId, 'google')
    }
    
    if (!token) {
      // Return a helpful error that the AI can understand and work around
      return {
        error: 'Google Docs not connected',
        message: 'Google Docs integration is not connected. Please connect Google account in Settings > Integrations to use this feature.',
        connected: false
      }
    }

    try {
      // Create document
      const createResponse = await fetch(
        'https://docs.googleapis.com/v1/documents',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: params.title
          })
        }
      )

      if (!createResponse.ok) {
        if (createResponse.status === 401) {
          throw new Error('Google Docs token expired. Please reconnect.')
        }
        throw new Error(`Google Docs API error: ${createResponse.statusText}`)
      }

      const doc = await createResponse.json()
      const documentId = doc.documentId

      // Insert content
      const insertResponse = await fetch(
        `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  location: {
                    index: 1
                  },
                  text: params.content
                }
              }
            ]
          })
        }
      )

      if (!insertResponse.ok) {
        throw new Error(`Failed to insert content: ${insertResponse.statusText}`)
      }

      const docUrl = `https://docs.google.com/document/d/${documentId}/edit`

      // Save document record in database
      await supabaseAdmin.from('documents').insert({
        user_id: userId,
        title: params.title,
        type: 'other',
        content: params.content,
        link: docUrl,
        status: 'draft'
      })

      return {
        documentId,
        title: params.title,
        url: docUrl,
        message: 'Google Doc created successfully'
      }
    } catch (error: any) {
      throw new Error(`Failed to create Google Doc: ${error.message}`)
    }
  }
})

