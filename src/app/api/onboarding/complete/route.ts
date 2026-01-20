import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateRoadmap } from '@/lib/ai'
import { summarizeNorthStar } from '@/lib/north-star-summarizer'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, building, skills, experience, networkSize, ideas, funds, hoursPerWeek, goal, integrations } = await req.json()

    // Generate AI summaries for North Star
    let buildingDescriptionSummary = null
    let currentGoalSummary = null

    if (building && building.trim()) {
      try {
        buildingDescriptionSummary = await summarizeNorthStar(building)
      } catch (error) {
        console.error('[Onboarding] Error generating building description summary:', error)
        buildingDescriptionSummary = building.trim().length > 100
          ? building.trim().substring(0, 97) + '...'
          : building.trim()
      }
    }

    if (goal && goal.trim()) {
      try {
        currentGoalSummary = await summarizeNorthStar(goal)
      } catch (error) {
        console.error('[Onboarding] Error generating current goal summary:', error)
        currentGoalSummary = goal.trim().length > 100
          ? goal.trim().substring(0, 97) + '...'
          : goal.trim()
      }
    }

    // Update user profile with all onboarding data
    await supabaseAdmin
      .from('users')
      .update({
        name: name || user.email?.split('@')[0],
        onboarding_complete: true,
        current_goal: goal,
        current_goal_summary: currentGoalSummary,
        funds_available: funds || 0,
        hours_per_week: hoursPerWeek || 0,
        building_description: building || null,
        building_description_summary: buildingDescriptionSummary,
        experience_summary: experience || null,
        network_size: networkSize || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    // Insert skills
    if (skills?.length > 0) {
      await supabaseAdmin.from('skills').insert(
        skills.map((skill: any) => ({
          user_id: user.id,
          name: skill.name,
          type: skill.type || 'other',
          proficiency: skill.proficiency || 'intermediate',
        }))
      )
    }

    // Experience and network size are now stored directly in users table

    // Insert ideas
    if (ideas?.length > 0) {
      await supabaseAdmin.from('ideas').insert(
        ideas.map((idea: any) => ({
          user_id: user.id,
          title: idea.title,
          description: idea.description || '',
          validation_status: 'idea',
        }))
      )
    }

    // Generate initial roadmap
    const roadmap = await generateRoadmap(goal, hoursPerWeek)

    if (roadmap?.length > 0) {
      const roadmapItems = roadmap.slice(0, 4).map((item: any, index: number) => ({
        user_id: user.id,
        title: item.title || item.milestone,
        description: item.tasks?.join('\n') || '',
        status: index === 0 ? 'todo' : 'todo',
        priority: index,
        due_date: new Date(Date.now() + (item.week || (index + 1)) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      }))

      await supabaseAdmin.from('roadmap_items').insert(roadmapItems)
    }

    // Store integration preferences and create monitoring jobs
    if (integrations) {
      const enabledIntegrations = Object.entries(integrations)
        .filter(([_, enabled]) => enabled)
        .map(([id, _]) => id)
      
      if (enabledIntegrations.length > 0) {
        // Create monitoring jobs for requested integrations
        const { getOrCreateMonitoringJob } = await import('@/lib/integrations/integration-monitor')
        
        for (const integrationId of enabledIntegrations) {
          // Map integration IDs to monitoring job types
          const jobTypeMap: Record<string, string> = {
            'gmail': 'email_check',
            'google-calendar': 'calendar_check',
            'slack': 'slack_check',
            'stripe': 'payment_check',
          }
          
          const jobType = jobTypeMap[integrationId] || `${integrationId}_check`
          
          try {
            await getOrCreateMonitoringJob(user.id, jobType, integrationId, 30) // Check every 30 minutes
          } catch (error) {
            console.error(`Failed to create monitoring job for ${integrationId}:`, error)
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
