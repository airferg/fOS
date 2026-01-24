import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateResponse } from '../../../lib/ai'

async function analyzeForActions(
  userMessage: string,
  context: { goal: string; contacts: any[]; skills: any[] }
) {
  const actions = []

  // Check if user wants to send emails
  if (userMessage.toLowerCase().includes('reach out') ||
      userMessage.toLowerCase().includes('email') ||
      userMessage.toLowerCase().includes('contact')) {
    actions.push({
      type: 'email',
      title: 'Draft outreach emails',
      details: `Send emails to relevant people in your network about ${context.goal}`,
      data: {
        goal: context.goal,
        recipients: context.contacts.slice(0, 3).map(c => c.email),
      },
    })
  }

  // Check if user wants to create documents
  if (userMessage.toLowerCase().includes('document') ||
      userMessage.toLowerCase().includes('write') ||
      userMessage.toLowerCase().includes('script') ||
      userMessage.toLowerCase().includes('pitch')) {
    actions.push({
      type: 'document',
      title: 'Generate document',
      details: 'Create a startup document based on your request',
      data: {
        type: 'memo',
        context: userMessage,
      },
    })
  }

  // Check if user wants to schedule calls
  if (userMessage.toLowerCase().includes('schedule') ||
      userMessage.toLowerCase().includes('call') ||
      userMessage.toLowerCase().includes('meeting')) {
    actions.push({
      type: 'schedule',
      title: 'Schedule calls',
      details: 'Set up meetings with your contacts',
      data: {
        contacts: context.contacts.slice(0, 3),
      },
    })
  }

  return actions
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, type = 'general', mentionedContacts } = await req.json()

    // Get user context
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: skills } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', user.id)

    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)

    // Build context with mentioned contacts
    let mentionedContactsContext = ''
    if (mentionedContacts && mentionedContacts.length > 0) {
      mentionedContactsContext = `\nMentioned Contacts (use these when the user references them by @mention):\n${mentionedContacts.map((c: any) => 
        `- ${c.name}${c.email ? ` (${c.email})` : ''}${c.company ? ` - ${c.company}` : ''}${c.position ? ` - ${c.position}` : ''}`
      ).join('\n')}\n`
    }

    // Build context
    const context = `
User Profile: ${userProfile?.name || 'User'} - ${userProfile?.current_goal || 'No goal set'}
Skills: ${skills?.map((s: any) => s.name).join(', ') || 'None listed'}
Network: ${contacts?.length || 0} contacts
Available Time: ${userProfile?.hours_per_week || 0} hours/week
Budget: $${userProfile?.funds_available || 0}${mentionedContactsContext}
`

    // Generate response with context
    const systemPrompt = `You are Hydra, an AI operating system for startup founders. ${context}
Help the user take action on their startup using what they have right now (Bird in Hand principle).
Be encouraging, practical, and suggest specific next steps. Keep responses SHORT - maximum 2-3 sentences. Get straight to the point.

IMPORTANT: If the user asks you to DO something (not just discuss it), suggest an action that can be executed by the dynamic TaskExecutorAgent. The agent can handle any task dynamically using available tools and integrations.`

    const response = await generateResponse(messages, systemPrompt)

    // Analyze if we should suggest actions - updated to use dynamic TaskExecutorAgent
    const lastMessage = messages[messages.length - 1]?.content || ''
    const actions = []
    
    // Check if user wants to DO something (execute a task)
    const actionKeywords = ['send', 'create', 'schedule', 'book', 'draft', 'email', 'call', 'meeting', 'update', 'add', 'generate', 'write', 'check', 'find', 'lookup', 'remind']
    const isActionRequest = actionKeywords.some(keyword => lastMessage.toLowerCase().includes(keyword))
    
    if (isActionRequest) {
      // Suggest dynamic agent action using TaskExecutorAgent
      actions.push({
        type: 'agent_id',
        title: 'Execute task',
        details: `I can handle this using available tools and integrations. Click to execute.`,
        data: {
          agentId: 'task-executor',
          input: {
            task: lastMessage
          }
        }
      })
    } else {
      // Fallback to legacy actions for backwards compatibility
      const legacyActions = await analyzeForActions(lastMessage, {
        goal: userProfile?.current_goal || '',
        contacts: contacts || [],
        skills: skills || [],
      })
      actions.push(...legacyActions)
    }

    // Log the interaction
    await supabase
      .from('action_logs')
      .insert({
        user_id: user.id,
        action_type: 'ai_chat',
        action_details: { type, message: messages[messages.length - 1]?.content },
        status: 'success',
      })

    return NextResponse.json({ response, actions })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
