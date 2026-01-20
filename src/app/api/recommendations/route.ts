import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateRecommendations } from '@/lib/recommendation-engine'

/**
 * GET /api/recommendations
 * Get personalized recommendations for the user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Recommendations API] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if we have recent recommendations in the database (within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: existingRecommendations, error: fetchError } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gte('generated_at', oneDayAgo)
      .order('priority', { ascending: false })
      .order('generated_at', { ascending: false })
      .limit(10)

    // If we have recent recommendations, return them
    if (existingRecommendations && existingRecommendations.length > 0) {
      console.log('[Recommendations API] Found', existingRecommendations.length, 'existing recommendations')
      
      const recommendations = existingRecommendations.map((rec: any) => ({
        id: rec.id,
        type: rec.type,
        priority: rec.priority,
        title: rec.title,
        description: rec.description || '',
        functionContext: rec.function_context || undefined,
        reasoning: rec.reasoning || '',
        impact: rec.impact || '',
        effort: rec.effort || 'medium',
        timeframe: rec.timeframe || '',
        canDoAgentically: rec.can_do_agentically || false,
        agenticDescription: rec.agentic_description || '',
        manualDescription: rec.manual_description || '',
        action: rec.action_data || undefined
      }))

      return NextResponse.json({
        recommendations,
        count: recommendations.length,
        source: 'database'
      })
    }

    // No recent recommendations, generate new ones and save to database
    console.log('[Recommendations API] No recent recommendations found, generating new ones for user:', user.id)
    const recommendations = await generateRecommendations(user.id)
    console.log('[Recommendations API] Generated', recommendations.length, 'new recommendations')

    // Save recommendations to database
    if (recommendations.length > 0) {
      const recommendationsToSave = recommendations.map((rec) => ({
        user_id: user.id,
        type: rec.type,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        function_context: rec.functionContext || null,
        reasoning: rec.reasoning,
        impact: rec.impact,
        effort: rec.effort,
        timeframe: rec.timeframe,
        can_do_agentically: rec.canDoAgentically,
        agentic_description: rec.agenticDescription,
        manual_description: rec.manualDescription,
        action_data: rec.action || null,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expire in 7 days
      }))

      const { error: insertError } = await supabase
        .from('recommendations')
        .insert(recommendationsToSave)

      if (insertError) {
        console.error('[Recommendations API] Error saving recommendations:', insertError)
      } else {
        console.log('[Recommendations API] Saved', recommendationsToSave.length, 'recommendations to database')
      }
    }

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
      source: 'generated'
    })
  } catch (error: any) {
    console.error('[Recommendations API] Error:', error)
    console.error('[Recommendations API] Stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations', recommendations: [] },
      { status: 500 }
    )
  }
}

