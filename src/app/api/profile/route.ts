import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { summarizeNorthStar } from '@/lib/north-star-summarizer'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[Profile API] Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // If user doesn't exist (PGRST116), create a basic profile
      if (error.code === 'PGRST116') {
        const userName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] ||
                        'User'
        
        try {
          // Use admin client to bypass RLS when creating user profile
          // Insert without display_name since column doesn't exist in schema
          // We'll set it client-side from name
          const { data: newUser, error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: user.id,
              email: user.email!,
              name: userName,
              onboarding_complete: true,
            })
            .select()
            .single()
          
          if (insertError) {
            console.error('[Profile API] Insert error:', insertError)
            return NextResponse.json({ 
              error: insertError.message || 'Failed to create profile',
              code: insertError.code,
              details: insertError.details 
            }, { status: 400 })
          }
          
          // Add display_name client-side since column doesn't exist
          return NextResponse.json({ ...newUser, display_name: userName })
        } catch (insertErr: any) {
          console.error('[Profile API] Exception during insert:', insertErr)
          return NextResponse.json({ 
            error: insertErr.message || 'Failed to create profile',
            details: insertErr.toString()
          }, { status: 400 })
        }
      }
      
      return NextResponse.json({ 
        error: error.message || 'Database error',
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 400 })
    }

    // Since display_name column doesn't exist, always set it client-side from name
    if (data && data.name) {
      return NextResponse.json({ ...data, display_name: data.name })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email,
          ...body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Only update fields that are provided
    if (body.building_description !== undefined) {
      const buildingDescription = body.building_description || null
      updateData.building_description = buildingDescription
      
      // Generate AI summary for building description
      if (buildingDescription && buildingDescription.trim()) {
        try {
          const summary = await summarizeNorthStar(buildingDescription)
          updateData.building_description_summary = summary
        } catch (error) {
          console.error('[Profile API] Error generating building description summary:', error)
          // Fallback to truncated version if AI fails
          updateData.building_description_summary = buildingDescription.trim().length > 100
            ? buildingDescription.trim().substring(0, 97) + '...'
            : buildingDescription.trim()
        }
      } else {
        updateData.building_description_summary = null
      }
    }
    
    if (body.current_goal !== undefined) {
      const currentGoal = body.current_goal || null
      updateData.current_goal = currentGoal
      
      // Generate AI summary for current goal
      if (currentGoal && currentGoal.trim()) {
        try {
          const summary = await summarizeNorthStar(currentGoal)
          updateData.current_goal_summary = summary
        } catch (error) {
          console.error('[Profile API] Error generating current goal summary:', error)
          // Fallback to truncated version if AI fails
          updateData.current_goal_summary = currentGoal.trim().length > 100
            ? currentGoal.trim().substring(0, 97) + '...'
            : currentGoal.trim()
        }
      } else {
        updateData.current_goal_summary = null
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
