/**
 * Real-time Subscription System
 * Uses Supabase real-time subscriptions to detect database changes
 * This replaces polling for internal data changes
 */

import { supabase } from '@/lib/supabase'
import { processEvents } from '@/lib/proactive/proactive-engine'

/**
 * Set up real-time subscriptions for database changes
 * These trigger proactive events when data changes in the database
 */
export function setupRealtimeSubscriptions(userId: string, onEvent?: () => void) {
  console.log(`[Realtime Subscriptions] Setting up subscriptions for user ${userId}`)

  // Subscribe to roadmap changes
  const roadmapChannel = supabase
    .channel(`roadmap:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'roadmap_items',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[Realtime] Roadmap change detected:', payload.eventType)
        
        // Create event for roadmap update
        await createRoadmapEvent(userId, payload)
        
        // Process events to generate proactive messages
        if (onEvent) {
          onEvent()
        } else {
          await processEvents(userId)
        }
      }
    )
    .subscribe()

  // Subscribe to funding changes
  const fundingChannel = supabase
    .channel(`funding:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'funding_rounds',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[Realtime] Funding change detected:', payload.eventType)
        await createFundingEvent(userId, payload)
        if (onEvent) {
          onEvent()
        } else {
          await processEvents(userId)
        }
      }
    )
    .subscribe()

  // Subscribe to contact changes
  const contactsChannel = supabase
    .channel(`contacts:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'contacts',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[Realtime] Contact change detected:', payload.eventType)
        // Contact changes are usually less urgent, so we don't always create events
        // This is more for tracking purposes
      }
    )
    .subscribe()

  // Subscribe to budget changes
  const usersChannel = supabase
    .channel(`users:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[Realtime] User profile change detected')
        
        // Check if budget-related fields changed
        const newRecord = payload.new as any
        const oldRecord = payload.old as any
        
        if (
          newRecord.funds_available !== oldRecord.funds_available ||
          newRecord.budget !== oldRecord.budget ||
          newRecord.monthly_burn !== oldRecord.monthly_burn
        ) {
          await createBudgetEvent(userId, newRecord, oldRecord)
          if (onEvent) {
            onEvent()
          } else {
            await processEvents(userId)
          }
        }
      }
    )
    .subscribe()

  return {
    roadmapChannel,
    fundingChannel,
    contactsChannel,
    usersChannel,
    cleanup: () => {
      supabase.removeChannel(roadmapChannel)
      supabase.removeChannel(fundingChannel)
      supabase.removeChannel(contactsChannel)
      supabase.removeChannel(usersChannel)
    },
  }
}

/**
 * Create a roadmap event from database change
 */
async function createRoadmapEvent(userId: string, payload: any) {
  const { createServerSupabaseClient } = await import('@/lib/supabase-server')
  const supabase = await createServerSupabaseClient()
  
  const record = payload.new || payload.old
  
  if (!record) return

  const eventType = payload.eventType
  const isCompleted = record.status === 'done'
  const isCreated = eventType === 'INSERT'

  let title = ''
  let description = ''
  let severity: 'urgent' | 'important' | 'info' | 'low' = 'info'

  if (isCompleted) {
    title = `Completed: ${record.title}`
    description = `Great progress! You completed "${record.title}".`
    severity = 'info'
  } else if (isCreated) {
    title = `New Task: ${record.title}`
    description = `Added new roadmap item: "${record.title}"`
    severity = 'info'
  } else {
    // UPDATE
    title = `Updated: ${record.title}`
    description = `Roadmap item "${record.title}" was updated.`
    severity = 'info'
  }

  await supabase.from('events').insert({
    user_id: userId,
    event_type: 'roadmap_update',
    event_source: 'internal',
    severity,
    title,
    description,
    metadata: {
      roadmapItemId: record.id,
      title: record.title,
      status: record.status,
      changeType: eventType,
    },
  })
}

/**
 * Create a funding event from database change
 */
async function createFundingEvent(userId: string, payload: any) {
  const { createServerSupabaseClient } = await import('@/lib/supabase-server')
  const supabase = await createServerSupabaseClient()
  
  const record = payload.new || payload.old
  
  if (!record) return

  const eventType = payload.eventType

  if (eventType === 'INSERT' && record.status === 'closed') {
    await supabase.from('events').insert({
      user_id: userId,
      event_type: 'budget_change',
      event_source: 'internal',
      severity: 'important',
      title: `Funding Round Closed: ${record.round_name}`,
      description: `Raised $${(record.amount_raised || 0).toLocaleString()} in ${record.round_name}`,
      metadata: {
        roundId: record.id,
        roundName: record.round_name,
        amountRaised: record.amount_raised,
      },
    })
  }
}

/**
 * Create a budget event from user profile change
 */
async function createBudgetEvent(userId: string, newRecord: any, oldRecord: any) {
  const { createServerSupabaseClient } = await import('@/lib/supabase-server')
  const supabase = await createServerSupabaseClient()
  
  const newBudget = newRecord.funds_available || newRecord.budget || 0
  const oldBudget = oldRecord.funds_available || oldRecord.budget || 0
  const monthlyBurn = newRecord.monthly_burn || 10000
  
  const budgetChange = newBudget - oldBudget
  const runwayMonths = monthlyBurn > 0 ? newBudget / monthlyBurn : 0

  await supabase.from('events').insert({
    user_id: userId,
    event_type: 'budget_change',
    event_source: 'internal',
    severity: budgetChange < 0 ? 'urgent' : runwayMonths < 3 ? 'important' : 'info',
    title: budgetChange >= 0 ? 'Budget Updated' : 'Budget Decreased',
    description: budgetChange >= 0
      ? `Budget increased by $${budgetChange.toLocaleString()}`
      : `Budget decreased by $${Math.abs(budgetChange).toLocaleString()}. Runway: ${runwayMonths.toFixed(1)} months`,
    metadata: {
      oldBudget,
      newBudget,
      change: budgetChange,
      monthlyBurn,
      runwayMonths,
    },
  })
}

