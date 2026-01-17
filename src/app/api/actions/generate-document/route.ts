import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateDocument } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, context, title } = await req.json()

    // Generate document content with AI
    const content = await generateDocument(type, context)

    // Get user's preferred tool
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('preferred_tool_docs')
      .eq('id', user.id)
      .single()

    let documentLink = null

    // Create document in user's preferred tool
    if (userProfile?.preferred_tool_docs === 'notion') {
      documentLink = await createNotionDocument(user.id, title || type, content)
    } else {
      documentLink = await createGoogleDoc(user.id, title || type, content)
    }

    // Save document record
    const { data: document } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: user.id,
        title: title || type,
        type: type as any,
        content,
        link: documentLink,
        status: 'draft',
      })
      .select()
      .single()

    // Log action
    await supabaseAdmin.from('action_logs').insert({
      user_id: user.id,
      action_type: 'generate_document',
      action_details: { type, context },
      status: 'success',
      result: { documentId: document?.id },
    })

    return NextResponse.json({
      message: `Created ${type} document`,
      document,
    })
  } catch (error) {
    console.error('Generate document error:', error)
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 })
  }
}

async function createGoogleDoc(userId: string, title: string, content: string): Promise<string | null> {
  try {
    const { data: tokens } = await supabaseAdmin
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single()

    if (!tokens) return null

    const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    })

    const doc = await createResponse.json()

    await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          insertText: {
            location: { index: 1 },
            text: content,
          },
        }],
      }),
    })

    return `https://docs.google.com/document/d/${doc.documentId}/edit`
  } catch (error) {
    console.error('Google Docs creation error:', error)
    return null
  }
}

async function createNotionDocument(userId: string, title: string, content: string): Promise<string | null> {
  try {
    const { data: tokens } = await supabaseAdmin
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'notion')
      .single()

    if (!tokens) return null

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { type: 'workspace' },
        properties: {
          title: {
            title: [{ text: { content: title } }],
          },
        },
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content } }],
          },
        }],
      }),
    })

    const page = await response.json()
    return page.url
  } catch (error) {
    console.error('Notion creation error:', error)
    return null
  }
}
