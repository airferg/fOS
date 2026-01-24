import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createCapTableFromData } from '@/lib/cap-table'

/**
 * GET /api/team - Get all team members
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch team members with vesting schedules
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select(`
        *,
        vesting_schedules (*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Log for debugging
    const totalEquity = (teamMembers || []).reduce((sum: number, m: any) => sum + (Number(m.equity_percent) || 0), 0)
    console.log(`[Team API] Returning ${teamMembers?.length || 0} team members, total equity: ${totalEquity.toFixed(2)}%`)

    return NextResponse.json({
      teamMembers: teamMembers || []
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/team - Create a new team member
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, role, title, equity_percent, start_date } = body

    // If employee is getting equity, we need to dilute ALL existing shareholders (team + investors)
    if (equity_percent && equity_percent > 0) {
      // Get all existing team members
      const { data: existingTeamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('id, equity_percent')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (teamError) {
        console.error('[Team API] Error fetching team members:', teamError)
      } else if (existingTeamMembers && existingTeamMembers.length > 0) {
        // Get all existing investors
        const { data: existingInvestors, error: investorsError } = await supabase
          .from('investors')
          .select('id, equity_percent')
          .eq('user_id', user.id)

        // Calculate total existing equity (team + investors)
        const totalTeamEquity = (existingTeamMembers || []).reduce((sum: number, m: any) => {
          return sum + (Number(m.equity_percent) || 0)
        }, 0)

        const totalInvestorEquity = (existingInvestors || []).reduce((sum: number, inv: any) => {
          return sum + (Number(inv.equity_percent) || 0)
        }, 0)

        const totalExistingEquity = totalTeamEquity + totalInvestorEquity

        if (totalExistingEquity > 0) {
          // Calculate dilution factor: (100 - new_equity) / 100
          const dilutionFactor = (100 - equity_percent) / 100
          console.log(`[Team API] Diluting existing shareholders by factor: ${dilutionFactor} (new employee getting ${equity_percent}%)`)

          // Dilute all existing team members
          for (const member of existingTeamMembers) {
            const oldEquity = Number(member.equity_percent) || 0
            const newEquity = oldEquity * dilutionFactor
            await supabase
              .from('team_members')
              .update({ 
                equity_percent: Math.round(newEquity * 100) / 100,
                updated_at: new Date().toISOString()
              })
              .eq('id', member.id)
              .eq('user_id', user.id)
          }

          // Dilute all existing investors
          if (!investorsError && existingInvestors && existingInvestors.length > 0) {
            for (const inv of existingInvestors) {
              const oldEquity = Number(inv.equity_percent) || 0
              const newEquity = oldEquity * dilutionFactor
              await supabase
                .from('investors')
                .update({ 
                  equity_percent: Math.round(newEquity * 100) / 100,
                  updated_at: new Date().toISOString()
                })
                .eq('id', inv.id)
                .eq('user_id', user.id)
            }
            console.log(`[Team API] Diluted ${existingInvestors.length} existing investors`)
          }

          console.log(`[Team API] Diluted ${existingTeamMembers.length} team members`)
        }
      }
    }

    // Create team member
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .insert({
        user_id: user.id,
        name,
        email,
        role,
        title,
        equity_percent: equity_percent || 0,
        start_date: start_date || new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Create activity feed entry
    await supabase.from('activity_feed').insert({
      user_id: user.id,
      activity_type: 'team_joined',
      title: `${name} joined the team`,
      description: `${name} was added as ${role}`,
      actor_name: name,
      metadata: { team_member_id: teamMember.id, role, equity_percent },
      icon: ''
    })

    return NextResponse.json({ teamMember })
  } catch (error: any) {
    console.error('Error creating team member:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/team - Update a team member
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { memberId, equity_percent, vested_percent, title, role } = body

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    // Get current equity before update
    const { data: currentMember } = await supabase
      .from('team_members')
      .select('equity_percent, user_id')
      .eq('id', memberId)
      .eq('user_id', user.id)
      .single()

    if (!currentMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    const isCurrentUser = currentMember.user_id === user.id
    const oldEquity = Number(currentMember.equity_percent) || 0
    const newEquity = equity_percent !== undefined ? Number(equity_percent) : oldEquity
    const equityChange = newEquity - oldEquity

    // If equity is being increased, dilute all other shareholders
    if (equityChange > 0) {
      const dilutionFactor = (100 - equityChange) / 100

      // Get all other team members
      const { data: otherTeamMembers } = await supabase
        .from('team_members')
        .select('id, equity_percent')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .neq('id', memberId)

      // Dilute other team members
      if (otherTeamMembers && otherTeamMembers.length > 0) {
        for (const member of otherTeamMembers) {
          const oldMemberEquity = Number(member.equity_percent) || 0
          const newMemberEquity = oldMemberEquity * dilutionFactor
          await supabase
            .from('team_members')
            .update({ 
              equity_percent: Math.round(newMemberEquity * 100) / 100,
              updated_at: new Date().toISOString()
            })
            .eq('id', member.id)
            .eq('user_id', user.id)
        }
      }

      // Dilute all investors
      const { data: investors } = await supabase
        .from('investors')
        .select('id, equity_percent')
        .eq('user_id', user.id)

      if (investors && investors.length > 0) {
        for (const inv of investors) {
          const oldInvEquity = Number(inv.equity_percent) || 0
          const newInvEquity = oldInvEquity * dilutionFactor
          await supabase
            .from('investors')
            .update({ 
              equity_percent: Math.round(newInvEquity * 100) / 100,
              updated_at: new Date().toISOString()
            })
            .eq('id', inv.id)
            .eq('user_id', user.id)
        }
      }
    }

    // Update the team member in the team_members table
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (equity_percent !== undefined) updateData.equity_percent = equity_percent
    if (vested_percent !== undefined) updateData.vested_percent = vested_percent
    if (title !== undefined) updateData.title = title
    if (role !== undefined) updateData.role = role

    const { data: teamMember, error } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', memberId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // If updating current user's title, also update position in users table
    if (isCurrentUser && title !== undefined) {
      await supabase
        .from('users')
        .update({ position: title, updated_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    return NextResponse.json({ success: true, teamMember })
  } catch (error: any) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/team - Delete a team member
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    // Get the team member before deletion
    const { data: teamMember, error: fetchError } = await supabase
      .from('team_members')
      .select('id, name, role, equity_percent')
      .eq('id', memberId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // If the team member has equity, redistribute it using cap table
    const memberEquity = Number(teamMember.equity_percent) || 0
    if (memberEquity > 0) {
      try {
        // Get all active team members (excluding the one being deleted)
        const { data: remainingTeamMembers, error: teamError } = await supabase
          .from('team_members')
          .select('id, name, role, equity_percent')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .neq('id', memberId)

        // Get all investors
        const { data: investors, error: investorsError } = await supabase
          .from('investors')
          .select('id, name, equity_percent')
          .eq('user_id', user.id)

        if (!teamError && !investorsError) {
          // Create cap table from remaining members and investors
          const capTable = createCapTableFromData(
            (remainingTeamMembers || []).map(m => ({
              id: m.id,
              name: m.name,
              role: m.role,
              equity_percent: Number(m.equity_percent) || 0,
            })),
            (investors || []).map(inv => ({
              id: inv.id,
              name: inv.name,
              equity_percent: Number(inv.equity_percent) || 0,
            }))
          )

          // Remove the team member from cap table (this will redistribute their equity)
          capTable.removeEntry(memberId)

          // Get updated snapshot
          const snapshot = capTable.getSnapshot()
          console.log(`[Team API] Redistributed ${memberEquity}% equity. New total: ${snapshot.totalEquity}%`)

          // Update all remaining entries with new equity percentages
          for (const entry of snapshot.entries) {
            if (entry.type === 'founder' || entry.type === 'team') {
              await supabase
                .from('team_members')
                .update({ 
                  equity_percent: entry.equityPercent,
                  updated_at: new Date().toISOString()
                })
                .eq('id', entry.id)
                .eq('user_id', user.id)
            } else if (entry.type === 'investor') {
              await supabase
                .from('investors')
                .update({ 
                  equity_percent: entry.equityPercent,
                  updated_at: new Date().toISOString()
                })
                .eq('id', entry.id)
                .eq('user_id', user.id)
            }
          }
        }
      } catch (capTableError: any) {
        console.error('[Team API] Error redistributing equity:', capTableError)
        // Continue with deletion even if equity redistribution fails
      }
    }

    // Hard delete the team member row from database
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    // Create activity feed entry
    await supabase.from('activity_feed').insert({
      user_id: user.id,
      activity_type: 'team_left',
      title: `${teamMember.name} left the team`,
      description: `${teamMember.name} was removed from the team`,
      actor_name: teamMember.name,
      metadata: { team_member_id: teamMember.id },
      icon: ''
    })

    return NextResponse.json({ success: true, message: 'Team member deleted and equity redistributed' })
  } catch (error: any) {
    console.error('Error deleting team member:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
