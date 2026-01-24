import { createServerSupabaseClient } from '@/lib/supabase-server'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { getConnectedIntegrations } from '@/lib/integrations/integration-monitor'
import { getAgentIntegrationMap } from '@/lib/integrations/integration-requirements'

/**
 * Proactive AI Engine
 * Monitors events and generates AI-initiated messages
 */

export interface ProactiveMessage {
  id: string
  message: string
  priority: 'urgent' | 'important' | 'info' | 'low'
  suggestedActions: Array<{
    type: string
    title: string
    data: any
  }>
  eventId?: string
}

export interface EventContext {
  eventType: string
  eventSource: string
  metadata: Record<string, any>
  userContext: {
    profile: any
    roadmapItems: any[]
    contacts: any[]
    recentConversations: any[]
  }
}

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit text length
    })

    return response.data[0].embedding
  } catch (error: any) {
    console.error('Error generating embedding:', error)
    throw new Error(`Failed to generate embedding: ${error.message}`)
  }
}

/**
 * Process events and generate proactive messages
 * @param userId - The user ID to process events for
 * @param supabaseClient - Optional Supabase client (if not provided, creates a new one)
 */
export async function processEvents(userId: string, supabaseClient?: any): Promise<ProactiveMessage[]> {
  console.log(`[Proactive Engine] 🤖 Processing events for user ${userId}...`)
  const supabase = supabaseClient || await createServerSupabaseClient()

  // Get unprocessed events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .is('processed_at', null)
    .order('detected_at', { ascending: false })
    .limit(10)

  if (eventsError) {
    console.error(`[Proactive Engine] ❌ Error fetching events:`, eventsError.message)
    return []
  }

  if (!events || events.length === 0) {
    console.log(`[Proactive Engine] ℹ️  No unprocessed events found`)
    return []
  }

  console.log(`[Proactive Engine] 📋 Found ${events.length} unprocessed event(s)`)

  // Get user context and connected integrations
  console.log(`[Proactive Engine] 📊 Gathering user context and integration status...`)
  const userContext = await getUserContext(userId)
  const connectedIntegrations = await getConnectedIntegrations(userId)
  console.log(`[Proactive Engine] 🔌 Connected integrations: ${Array.from(connectedIntegrations).join(', ') || 'None'}`)

  const messages: ProactiveMessage[] = []

  for (const event of events) {
    try {
      console.log(`[Proactive Engine] 🔄 Processing event: ${event.event_type} (${event.title})`)
      
      // Check if there's already a pending proactive message for this event (by event_id)
      const { data: existingMessages } = await supabase
        .from('proactive_messages')
        .select('id, status')
        .eq('user_id', userId)
        .eq('event_id', event.id)
        .in('status', ['pending', 'delivered', 'read'])
        .limit(1)
      
      if (existingMessages && existingMessages.length > 0) {
        console.log(`[Proactive Engine] ⏭️  Skipping event ${event.id} - already has a pending/delivered message`)
        // Mark event as processed to prevent future checks
        await supabase
          .from('events')
          .update({ processed_at: new Date().toISOString() })
          .eq('id', event.id)
        continue
      }
      
      // Also check for duplicate events by calendar event ID (metadata.eventId) for calendar events
      if (event.event_type === 'calendar_event' && event.metadata?.eventId) {
        const { data: duplicateEvents } = await supabase
          .from('events')
          .select('id')
          .eq('user_id', userId)
          .eq('event_type', 'calendar_event')
          .not('processed_at', 'is', null) // Only check processed events
          .contains('metadata', { eventId: event.metadata.eventId })
          .limit(1)
        
        if (duplicateEvents && duplicateEvents.length > 0) {
          console.log(`[Proactive Engine] ⏭️  Skipping event ${event.id} - duplicate calendar event already processed`)
          // Check if there's a message for the duplicate event
          const { data: duplicateMessages } = await supabase
            .from('proactive_messages')
            .select('id')
            .eq('user_id', userId)
            .eq('event_id', duplicateEvents[0].id)
            .in('status', ['pending', 'delivered', 'read'])
            .limit(1)
          
          if (duplicateMessages && duplicateMessages.length > 0) {
            // Mark this duplicate event as processed
            await supabase
              .from('events')
              .update({ processed_at: new Date().toISOString() })
              .eq('id', event.id)
            continue
          }
        }
      }
      
      const context: EventContext = {
        eventType: event.event_type,
        eventSource: event.event_source,
        metadata: event.metadata || {},
        userContext,
      }

      // Check if tasks related to this event have already been completed
      const completedTasks = await checkCompletedTasksForEvent(userId, event)
      
      // If all relevant tasks are completed, skip generating a message and mark event as processed
      if (completedTasks.length > 0 && event.event_type === 'calendar_event') {
        // Check if completed tasks indicate full preparation
        const hasFullPrep = completedTasks.some(task => {
          const taskInput = JSON.stringify(task.input || {}).toLowerCase()
          const taskName = (task.agent_name || '').toLowerCase()
          return (taskName.includes('prepare') || taskInput.includes('prepare') || 
                  taskInput.includes('meeting prep') || taskInput.includes('prep doc'))
        })
        
        if (hasFullPrep) {
          console.log(`[Proactive Engine] ✅ Event ${event.id} already has completed prep tasks - marking as processed without message`)
          await supabase
            .from('events')
            .update({ processed_at: new Date().toISOString() })
            .eq('id', event.id)
          continue
        }
      }
      
      const message = await generateProactiveMessage(userId, event, context, connectedIntegrations, completedTasks)

      if (message) {
        console.log(`[Proactive Engine] ✨ Generated recommendation: "${message.message.substring(0, 50)}..."`)
        console.log(`[Proactive Engine] 💾 Storing proactive message...`)
        
        // Store proactive message
        const { data: storedMessage, error: storeError } = await supabase
          .from('proactive_messages')
          .insert({
            user_id: userId,
            event_id: event.id,
            message: message.message,
            priority: message.priority,
            suggested_actions: message.suggestedActions,
            context: context,
            status: 'pending',
          })
          .select()
          .single()

        if (!storeError && storedMessage) {
          console.log(`[Proactive Engine] ✅ Message stored with ID: ${storedMessage.id}`)
          
          // Mark event as processed
          await supabase
            .from('events')
            .update({ processed_at: new Date().toISOString() })
            .eq('id', event.id)

          messages.push({
            id: storedMessage.id,
            message: message.message,
            priority: message.priority,
            suggestedActions: message.suggestedActions,
            eventId: event.id,
          })
        } else {
          console.error(`[Proactive Engine] ❌ Failed to store message:`, storeError?.message)
        }
      } else {
        console.log(`[Proactive Engine] ⚠️  No message generated for event ${event.id}`)
      }
    } catch (error: any) {
      console.error(`[Proactive Engine] ❌ Error processing event ${event.id}:`, error.message)
    }
  }

  console.log(`[Proactive Engine] ✅ Processing complete. Generated ${messages.length} recommendation(s)`)
  return messages
}

/**
 * Check if tasks related to an event have already been completed
 */
async function checkCompletedTasksForEvent(userId: string, event: any): Promise<Array<{ agent_name: string; completed_at: string; input: any }>> {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Get recently completed agent tasks (within last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: completedTasks } = await supabase
      .from('agent_tasks')
      .select('agent_name, completed_at, input, output')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', yesterday)
      .order('completed_at', { ascending: false })
      .limit(20)
    
    if (!completedTasks || completedTasks.length === 0) {
      return []
    }
    
    // For calendar events, check if tasks mention the meeting or similar preparation
    if (event.event_type === 'calendar_event') {
      const eventTitle = (event.title || '').toLowerCase()
      const eventMetadata = event.metadata || {}
      const attendeeNames = (eventMetadata.attendees || []).map((a: any) => (a.email || a.name || '').toLowerCase())
      
      // Filter tasks that might be related to this event
      const relatedTasks = completedTasks.filter(task => {
        const taskInput = JSON.stringify(task.input || {}).toLowerCase()
        const taskName = (task.agent_name || '').toLowerCase()
        const taskOutput = JSON.stringify(task.output || {}).toLowerCase()
        const allTaskText = `${taskName} ${taskInput} ${taskOutput}`.toLowerCase()
        
        // Check if task mentions the meeting title or attendee
        const mentionsTitle = eventTitle && (allTaskText.includes(eventTitle.substring(0, 20)) || allTaskText.includes(eventTitle.substring(0, 10)))
        const mentionsAttendee = attendeeNames.some((name: string | null | undefined) => {
          if (!name) return false
          const namePart = name.split('@')[0].split('.')[0] // Get first name part
          return namePart.length > 2 && allTaskText.includes(namePart)
        })
        
        // Check for meeting preparation patterns - be more aggressive in matching
        const isMeetingPrep = taskName.includes('meeting') || taskName.includes('prepare') || 
                             taskInput.includes('prepare') || taskInput.includes('preparation') ||
                             taskInput.includes('meeting') || taskInput.includes('meetings') ||
                             taskInput.includes('tomorrow') || taskInput.includes('calendar') ||
                             taskInput.includes('prep doc') || taskInput.includes('talking point') ||
                             taskInput.includes('agenda') || taskInput.includes('questions')
        
        // Check for follow-up patterns
        const isFollowUp = taskName.includes('follow') || taskInput.includes('follow-up') || 
                          taskInput.includes('followup') || taskInput.includes('follow up') ||
                          taskInput.includes('email') || taskInput.includes('draft')
        
        // If this is clearly a meeting-related event, match meeting prep tasks
        const isMeetingEvent = eventTitle.includes('meeting') || eventTitle.includes('call') || 
                               eventTitle.includes('sync') || eventTitle.includes('standup') ||
                               eventTitle.includes('conference') || eventTitle.includes('discussion')
        
        // More aggressive matching - if task executor was used and mentions meeting-related keywords, assume it's related
        const isTaskExecutorMeetingPrep = taskName.includes('task executor') && 
                                         (taskInput.includes('meeting') || taskInput.includes('prepare') || 
                                          taskInput.includes('calendar') || taskInput.includes('tomorrow'))
        
        return mentionsTitle || mentionsAttendee || (isMeetingPrep && isMeetingEvent) || 
               isFollowUp || isTaskExecutorMeetingPrep
      })
      
      return relatedTasks.map(t => ({
        agent_name: t.agent_name,
        completed_at: t.completed_at,
        input: t.input
      }))
    }
    
    return completedTasks.map(t => ({
      agent_name: t.agent_name,
      completed_at: t.completed_at,
      input: t.input
    }))
  } catch (error) {
    console.error('[Proactive Engine] Error checking completed tasks:', error)
    return []
  }
}

/**
 * Generate a proactive message based on event and context
 */
async function generateProactiveMessage(
  userId: string,
  event: any,
  context: EventContext,
  connectedIntegrations: Set<string>,
  completedTasks: Array<{ agent_name: string; completed_at: string; input: any }> = []
): Promise<ProactiveMessage | null> {
  // Get integration requirements from database for common agents
  const commonAgentIds = ['task-executor', 'prepare-meeting', 'follow-up-emails', 'draft-investor-email', 'generate-product-spec']
  const agentIntegrationMap = await getAgentIntegrationMap(commonAgentIds)

  // Check which integrations are connected
  const connectedList = Array.from(connectedIntegrations).join(', ')
  const missingIntegrations: string[] = []

  const systemPrompt = `You are Hydra, an AI co-founder for startup founders. You monitor their startup and proactively suggest actions.

Your role:
- Monitor changes in budget, calendar, messages, roadmap, contacts
- Detect when user needs attention or help
- Generate SHORT, structured messages
- Suggest specific actions they can take
- Be concise, friendly, and action-oriented
- Use the Bird in Hand principle (work with what they have)

IMPORTANT - Integration Status:
- Connected integrations: ${connectedList || 'None'}
- Only suggest actions that use connected integrations
- If an action requires integrations that aren't connected, mention which ones need to be connected
- Always check integration requirements before suggesting agent actions

CRITICAL: Message Format - Keep it SHORT (maximum 2-3 sentences):
1. Alert: Quick notification of what's happening
2. Event: What event/change was detected
3. Reason: Why it matters (1 sentence max)
4. Action: What they should do (be specific)

CRITICAL - Check for Completed Tasks:
${completedTasks.length > 0 ? `
RECENTLY COMPLETED TASKS (within last 24 hours):
${completedTasks.map((t, i) => `${i + 1}. ${t.agent_name} (completed at ${new Date(t.completed_at).toLocaleTimeString()})`).join('\n')}

IMPORTANT: Before suggesting actions, check if tasks for this event have ALREADY BEEN COMPLETED. If they have:
- Acknowledge completion briefly (1 sentence)
- DO NOT suggest the same actions again
- If all relevant tasks are done, acknowledge and offer a simple follow-up (e.g., "Want me to set a reminder 30 min before?")
` : `
No recently completed tasks found for this event. You can suggest actions normally.`}

EXAMPLE OF GOOD MESSAGE:
"Meeting with Jordan in 2 hours. Could be a good opportunity to discuss your startup goals. Want me to draft a quick agenda?"

Keep messages under 50 words. Maximum 3 sentences. Be direct and actionable.`

  const userPrompt = buildEventPrompt(event, context, connectedIntegrations, agentIntegrationMap)

  try {
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 200, // Reduced to enforce shorter messages
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const response = JSON.parse(content)

    // Filter suggested actions to only include those with connected integrations
    let filteredActions = (response.suggested_actions || []).filter((action: any) => {
      const requiredIntegrations = action.data?.required_integrations || []
      if (requiredIntegrations.length === 0) {
        return true // No integrations required, allow it
      }
      // Check if all required integrations are connected
      return requiredIntegrations.every((integration: string) => connectedIntegrations.has(integration))
    })
    
    // Filter out actions that have already been completed
    if (completedTasks.length > 0 && event.event_type === 'calendar_event') {
      filteredActions = filteredActions.filter((action: any) => {
        const actionTitle = (action.title || '').toLowerCase()
        const actionType = action.data?.agentId || ''
        
        // Check if this action type was already completed
        const isDuplicate = completedTasks.some(task => {
          const taskName = (task.agent_name || '').toLowerCase()
          const taskInput = JSON.stringify(task.input || {}).toLowerCase()
          
          // Check for common meeting prep patterns
          const isMeetingPrep = actionTitle.includes('prepare') || actionTitle.includes('meeting') || 
                               actionType === 'task-executor' && (taskInput.includes('prepare') || taskInput.includes('meeting'))
          const isFollowUp = actionTitle.includes('follow') || actionTitle.includes('email')
          const isDocCreation = actionTitle.includes('doc') || actionTitle.includes('talking point')
          
          // If task executor was used for meeting prep, and action is also meeting prep, filter it
          if (taskName.includes('task executor') || actionType === 'task-executor') {
            if (isMeetingPrep && (taskInput.includes('meeting') || taskInput.includes('prepare'))) {
              return true // Already did meeting prep
            }
          }
          
          // Check if action matches completed task name/type
          if (taskName.includes('prepare') && isMeetingPrep) return true
          if (taskName.includes('follow') && isFollowUp) return true
          if (taskName.includes('doc') && isDocCreation) return true
          
          return false
        })
        
        return !isDuplicate
      })
    }

    // If actions were filtered out, update the message to mention missing integrations
    let message = response.message || ''
    if (filteredActions.length < (response.suggested_actions || []).length) {
      const removedActions = (response.suggested_actions || []).filter((action: any) => {
        const requiredIntegrations = action.data?.required_integrations || []
        if (requiredIntegrations.length === 0) return false
        const hasAllIntegrations = requiredIntegrations.every((integration: string) => connectedIntegrations.has(integration))
        return !hasAllIntegrations
      })

      const missingIntegrations = new Set<string>()
      removedActions.forEach((action: any) => {
        (action.data?.required_integrations || []).forEach((integration: string) => {
          if (!connectedIntegrations.has(integration)) {
            missingIntegrations.add(integration)
          }
        })
      })

      if (missingIntegrations.size > 0) {
        const integrationNames: Record<string, string> = {
          'google_calendar': 'Google Calendar',
          'gmail': 'Gmail',
          'google_docs': 'Google Docs'
        }
        const missingNames = Array.from(missingIntegrations).map(i => integrationNames[i] || i).join(', ')
        message += `\n\nNote: Some actions require connecting ${missingNames}. Connect them in Settings > Integrations to unlock more features.`
      }
    }

    return {
      id: '', // Will be set after storage
      message,
      priority: response.priority || 'info',
      suggestedActions: filteredActions,
    }
  } catch (error: any) {
    // Handle OpenAI quota errors gracefully
    if (error.status === 429 && (error.code === 'insufficient_quota' || error.type === 'insufficient_quota')) {
      console.log(`[Proactive Engine] ⚠️  OpenAI quota exceeded. Skipping proactive message generation.`)
      return null
    }
    // Log other errors but don't crash
    console.error('[Proactive Engine] Error generating proactive message:', error.message || error)
    return null
  }
}

/**
 * Build prompt for event-based message generation
 */
function buildEventPrompt(
  event: any,
  context: EventContext,
  connectedIntegrations: Set<string>,
  agentIntegrationMap: Record<string, string[]>
): string {
  const { metadata, userContext } = context

  let prompt = `Generate a proactive message for the following event:

EVENT TYPE: ${event.event_type}
EVENT SOURCE: ${event.event_source}
SEVERITY: ${event.severity}
TITLE: ${event.title}
DESCRIPTION: ${event.description || 'N/A'}

NORTH STAR - WHAT THEY'RE BUILDING:
- Building: ${userContext.profile?.building_description || 'Not specified'}
- Goal: ${userContext.profile?.current_goal || 'Not set'}

USER CONTEXT:
- Stage: ${userContext.profile?.stage || 'Early stage'}
- Budget: $${userContext.profile?.budget || 0}
- Active Tasks: ${userContext.roadmapItems.filter(r => r.status === 'in_progress').length}
- Network Size: ${userContext.contacts.length} contacts

CRITICAL: All proactive messages and suggestions MUST directly relate to helping them BUILD "${userContext.profile?.building_description || userContext.profile?.current_goal || 'their startup'}". Every recommendation should clearly connect to what they're building.

EVENT METADATA:
${JSON.stringify(metadata, null, 2)}

Generate a JSON response:
{
  "message": "SHORT proactive message (under 50 words, 2-3 sentences max). Format: Alert + Event + Reason (1 sentence) + Action suggestion (1 sentence). Be direct and actionable.",
  "priority": "urgent|important|info|low",
  "suggested_actions": [
    {
      "type": "agent_id",
      "title": "Short action title (3-5 words max)",
      "data": {
        "input": {
          "task": "Clear, specific task description matching the action title. Example: If title is 'Review GitHub email', task should be 'Review GitHub email about OAuth access'"
        }
      }
    }
  ]
  
CRITICAL: Always include a "task" field in data.input that clearly describes what the agent should do. The task should match or expand on the action title.
}

Focus on:
- Brief alert of what's happening
- Why it matters (1 sentence)
- Specific actionable next step (1 sentence)

Keep it SHORT and DIRECT. No fluff, no explanations of goals or context unless absolutely necessary.`

  // Add event-specific context
  switch (event.event_type) {
    case 'budget_change':
      prompt += `\n\nThis is a budget change. Consider runway implications and whether to update stakeholders.`
      break
    case 'calendar_event':
      prompt += `\n\nThis is a calendar event. Consider preparation, follow-ups, and context.
      
IMPORTANT: Check the completed tasks list above. If tasks related to preparing for this meeting (like "Prepare for Tomorrow's Meeting", creating prep docs, drafting emails, etc.) have already been completed, DO NOT suggest them again. Instead:
- Acknowledge that preparation is already done
- Offer next-step suggestions (reminders, different prep items, follow-up automation)
- Or simply confirm everything is ready and ask if they need anything else`
      break
    case 'email':
      prompt += `\n\nThis is an email event. Consider urgency, relationships, and response needs.`
      break
    case 'roadmap_update':
      prompt += `\n\nThis is a roadmap update. Consider next steps, dependencies, and momentum.`
      break
  }

  return prompt
}

/**
 * Get user context for proactive message generation
 */
async function getUserContext(userId: string) {
  const supabase = await createServerSupabaseClient()

  const [
    { data: profile },
    { data: roadmapItems },
    { data: contacts },
    { data: recentConversations }
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('roadmap_items').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    supabase.from('contacts').select('*').eq('user_id', userId).limit(50),
    supabase.from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  return {
    profile: profile || {},
    roadmapItems: roadmapItems || [],
    contacts: contacts || [],
    recentConversations: recentConversations || []
  }
}

/**
 * Store conversation message with embedding
 */
export async function storeConversation(
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  threadId?: string,
  metadata?: Record<string, any>
): Promise<string> {
  const supabase = await createServerSupabaseClient()

  // Generate embedding for semantic search
  const embedding = await generateEmbedding(content)

  // Get or create thread
  const { data: threadData } = await supabase.rpc('get_or_create_thread', {
    user_uuid: userId,
    thread_id: threadId || null
  })

  const finalThreadId = threadData || threadId

  // Store conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      role,
      content,
      embedding,
      conversation_thread_id: finalThreadId,
      metadata: metadata || {}
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to store conversation: ${error.message}`)
  }

  // Update thread timestamp
  if (finalThreadId) {
    await supabase.rpc('update_thread_timestamp', {
      thread_uuid: finalThreadId
    })
  }

  return conversation.id
}

/**
 * Search conversations using semantic similarity
 */
export async function searchConversations(
  userId: string,
  query: string,
  limit: number = 5
): Promise<any[]> {
  const supabase = await createServerSupabaseClient()

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query)

  // Semantic search using cosine similarity
  const { data: conversations, error } = await supabase.rpc('match_conversations', {
    query_embedding: queryEmbedding,
    match_user_id: userId,
    match_threshold: 0.7,
    match_count: limit
  })

  if (error) {
    // Fallback to keyword search if vector search fails
    const { data: fallback } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    return fallback || []
  }

  return conversations || []
}

