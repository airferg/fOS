import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { storeConversation, processEvents } from '@/lib/proactive/proactive-engine'
import { detectAllEvents } from '@/lib/proactive/event-detector'

/**
 * Get proactive messages and convert to chat format
 * Also check for new events and generate messages on demand
 * GET /api/chat/proactive
 */
export async function GET(req: NextRequest) {
  console.log('[GET /api/chat/proactive] ===== REQUEST RECEIVED =====')
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('[GET /api/chat/proactive] User:', user?.id, 'Error:', authError?.message)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pending proactive messages (only real AI-generated recommendations)
    let messages = []
    const { data: messagesData, error: messagesError } = await supabase
      .from('proactive_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10) // Get more messages to show recent recommendations

    // If table doesn't exist yet (migrations not run), gracefully handle it
    if (messagesError) {
      if (messagesError.code === '42P01' || messagesError.message?.includes('does not exist')) {
        // Table doesn't exist - migrations not run yet
        console.log('[GET /api/chat/proactive] proactive_messages table does not exist - migrations need to be run')
        messages = []
      } else {
        // Other error - log but return empty
        console.error('[GET /api/chat/proactive] Error fetching proactive messages:', messagesError)
        messages = []
      }
    } else {
      messages = messagesData || []
    }

    // If no pending messages, check for new events and generate recommendations
    if (messages.length === 0) {
      console.log('[GET /api/chat/proactive] No pending messages, checking for new events...')
      try {
        // Detect any new events in the user's workflow
        const events = await detectAllEvents(user.id)
        console.log('[GET /api/chat/proactive] Detected', events.length, 'events')
        
        if (events.length > 0) {
          // Process events into proactive recommendations
          // Pass the authenticated supabase client to ensure RLS policies work
          const newMessages = await processEvents(user.id, supabase)
          console.log('[GET /api/chat/proactive] Generated', newMessages.length, 'new proactive messages')
          
          // Fetch the newly created messages
          if (newMessages.length > 0) {
            const { data: newMessagesData } = await supabase
              .from('proactive_messages')
              .select('*')
              .eq('user_id', user.id)
              .eq('status', 'pending')
              .in('id', newMessages.map(m => m.id))
              .order('created_at', { ascending: true })
            
            messages = newMessagesData || []
          }
        }
      } catch (error: any) {
        console.error('[GET /api/chat/proactive] Error checking for events:', error)
        // Continue with empty messages if event detection fails
      }
    }

    // Convert proactive messages to chat format
    // Only return actual AI-generated recommendations based on workflow changes
    const chatMessages = (messages || []).map(msg => ({
      id: msg.id,
      role: 'assistant' as const,
      content: msg.message,
      isProactive: true,
      priority: msg.priority,
      suggestedActions: msg.suggested_actions || [],
      eventId: msg.event_id,
      createdAt: msg.created_at
    }))

    console.log('[GET /api/chat/proactive] Returning', chatMessages.length, 'proactive recommendations')

    return NextResponse.json({
      messages: chatMessages,
      hasProactiveMessages: chatMessages.length > 0
    })
  } catch (error: any) {
    console.error('Proactive chat error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

/**
 * Mark proactive message as delivered
 * POST /api/chat/proactive
 */
export async function POST(req: NextRequest) {
  console.log('[POST /api/chat/proactive] ===== REQUEST RECEIVED =====')
  console.log('[POST /api/chat/proactive] URL:', req.url)
  console.log('[POST /api/chat/proactive] Method:', req.method)
  console.log('[POST /api/chat/proactive] Headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    console.log('[POST /api/chat/proactive] Creating Supabase client...')
    const supabase = await createServerSupabaseClient()
    
    console.log('[POST /api/chat/proactive] Getting user...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('[POST /api/chat/proactive] User:', user?.id, 'Error:', authError?.message)

    if (authError || !user) {
      console.log('[POST /api/chat/proactive] Unauthorized - returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let messageId: string | undefined
    try {
      console.log('[POST /api/chat/proactive] Parsing request body...')
      const body = await req.json()
      messageId = body.messageId
      console.log('[POST /api/chat/proactive] Message ID:', messageId)
    } catch (parseError: any) {
      console.error('[POST /api/chat/proactive] JSON parse error:', parseError)
      // If JSON parsing fails, return error
      return NextResponse.json({ error: 'Invalid request body', details: parseError.message }, { status: 400 })
    }

    if (!messageId) {
      console.log('[POST /api/chat/proactive] No messageId provided')
      return NextResponse.json({ error: 'messageId required' }, { status: 400 })
    }

    // Handle special case: "greeting" is not a database record, just return success
    if (messageId === 'greeting' || messageId === 'initial-greeting') {
      console.log('[POST /api/chat/proactive] Message is a greeting (not a DB record) - returning success')
      return NextResponse.json({ success: true, note: 'Greeting message - no database record to update' })
    }

    // Validate that messageId looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(messageId)) {
      console.log('[POST /api/chat/proactive] Invalid messageId format (not a UUID):', messageId)
      return NextResponse.json({ 
        success: true, 
        note: 'Message ID is not a database record (likely a generated greeting)' 
      })
    }

    console.log('[POST /api/chat/proactive] Fetching message from database...')
    // Mark as delivered and store in conversation
    const { data: message, error: fetchError } = await supabase
      .from('proactive_messages')
      .select('*')
      .eq('id', messageId)
      .eq('user_id', user.id)
      .single()

    console.log('[POST /api/chat/proactive] Message fetch result:', {
      hasMessage: !!message,
      error: fetchError?.message,
      errorCode: fetchError?.code
    })

    if (fetchError || !message) {
      // If table doesn't exist, just return success (graceful degradation)
      if (fetchError?.code === '42P01' || fetchError?.message?.includes('does not exist')) {
        console.log('[POST /api/chat/proactive] Table does not exist - graceful degradation')
        return NextResponse.json({ success: true, note: 'Table not created yet' })
      }
      // If it's a UUID format error, it means the messageId isn't a valid database ID
      if (fetchError?.code === '22P02' || fetchError?.message?.includes('invalid input syntax for type uuid')) {
        console.log('[POST /api/chat/proactive] Invalid UUID format - likely a generated message')
        return NextResponse.json({ 
          success: true, 
          note: 'Message is not a database record (likely a generated greeting)' 
        })
      }
      console.log('[POST /api/chat/proactive] Message not found')
      return NextResponse.json({ error: 'Message not found', details: fetchError?.message }, { status: 404 })
    }

    // Store in conversation history (if conversations table exists)
    try {
      console.log('[POST /api/chat/proactive] Storing conversation...')
      await storeConversation(
        user.id,
        'assistant',
        message.message,
        undefined,
        {
          proactiveMessageId: messageId,
          priority: message.priority,
          suggestedActions: message.suggested_actions
        }
      )
      console.log('[POST /api/chat/proactive] Conversation stored successfully')
    } catch (convError: any) {
      // If conversations table doesn't exist, continue anyway
      console.log('[POST /api/chat/proactive] Could not store conversation (table may not exist):', convError.message)
    }

    // Update message status
    console.log('[POST /api/chat/proactive] Updating message status...')
    const { error: updateError } = await supabase
      .from('proactive_messages')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', messageId)

    if (updateError) {
      console.log('[POST /api/chat/proactive] Update error:', updateError.message, updateError.code)
      // If table doesn't exist, just return success
      if (updateError.code === '42P01' || updateError.message?.includes('does not exist')) {
        console.log('[POST /api/chat/proactive] Table does not exist - graceful degradation')
        return NextResponse.json({ success: true, note: 'Table not created yet' })
      }
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    console.log('[POST /api/chat/proactive] ===== SUCCESS =====')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[POST /api/chat/proactive] ===== ERROR =====', error)
    console.error('[POST /api/chat/proactive] Error stack:', error.stack)
    return NextResponse.json({ error: error.message || 'Server error', details: error.toString() }, { status: 500 })
  }
}

