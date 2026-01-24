import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createCapTableFromData } from '@/lib/cap-table'

/**
 * GET /api/funding - Get all funding rounds and investors
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch funding rounds
    const { data: rounds, error: roundsError } = await supabase
      .from('funding_rounds')
      .select('*')
      .eq('user_id', user.id)
      .order('close_date', { ascending: false })

    if (roundsError) throw roundsError

    // Fetch investors with round information
    const { data: investors, error: investorsError } = await supabase
      .from('investors')
      .select(`
        *,
        funding_rounds (
          id,
          round_name,
          round_type
        )
      `)
      .eq('user_id', user.id)
      .order('investment_date', { ascending: false })

    if (investorsError) throw investorsError

    // Calculate total raised - count closed and raising rounds (committed money)
    // Planned rounds don't count as they're not yet committed
    const totalRaised = rounds
      ?.filter(r => r.status === 'closed' || r.status === 'raising')
      .reduce((sum, r) => sum + (Number(r.amount_raised) || 0), 0) || 0

    const activeRound = rounds?.find(r => r.status === 'raising')

    return NextResponse.json({
      rounds: rounds || [],
      investors: investors || [],
      stats: {
        totalRaised,
        totalInvestors: investors?.length || 0,
        activeRound: activeRound || null
      }
    })
  } catch (error: any) {
    console.error('Error fetching funding data:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/funding - Create a new funding round
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { round_name, round_type, amount_raised, valuation, close_date, status } = body

    // Map to database format: lowercase with hyphens (not underscores)
    // Database constraint allows: 'pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'bridge', 'other'
    const roundTypeMap: Record<string, string> = {
      'Pre-Seed': 'pre-seed',
      'pre-seed': 'pre-seed',
      'PreSeed': 'pre-seed',
      'pre_seed': 'pre-seed',
      'Seed': 'seed',
      'seed': 'seed',
      'Series A': 'series-a',
      'series-a': 'series-a',
      'SeriesA': 'series-a',
      'series_a': 'series-a',
      'Series B': 'series-b',
      'series-b': 'series-b',
      'SeriesB': 'series-b',
      'series_b': 'series-b',
      'Series C': 'series-c',
      'series-c': 'series-c',
      'SeriesC': 'series-c',
      'series_c': 'series-c',
      'Bridge': 'bridge',
      'bridge': 'bridge',
      'Convertible Note': 'other', // Not in DB constraint, map to 'other'
      'convertible_note': 'other',
      'ConvertibleNote': 'other',
      'other': 'other',
    }
    
    // Normalize to database format
    const normalizedRoundType: string | null = round_type 
      ? (roundTypeMap[round_type] || round_type.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-'))
      : null

    console.log(`[Funding API] Round type normalization: "${round_type}" -> "${normalizedRoundType}"`)

    // Create funding round
    const { data: round, error } = await supabase
      .from('funding_rounds')
      .insert({
        user_id: user.id,
        round_name,
        round_type: normalizedRoundType,
        amount_raised: amount_raised || 0,
        valuation,
        close_date,
        status: status || 'planned'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating funding round:', error)
      console.error(`[Funding API] Attempted to insert round_type: "${normalizedRoundType}" (original: "${round_type}")`)
      
      // Provide more helpful error message for constraint errors
      if (error.code === '23514' && error.message?.includes('round_type')) {
        const constraintError = new Error(
          `Invalid round type "${round_type}" (normalized to "${normalizedRoundType}"). ` +
          `Allowed values are: pre-seed, seed, series-a, series-b, series-c, bridge, other`
        )
        throw constraintError
      }
      throw error
    }

    // Create activity feed entry if closed
    if (status === 'closed') {
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        activity_type: 'funding_received',
        title: `${round_name} closed`,
        description: `Raised $${(amount_raised || 0).toLocaleString()}`,
        metadata: { round_id: round.id, amount_raised, round_name },
        icon: ''
      })
    }

    return NextResponse.json({ round })
  } catch (error: any) {
    console.error('Error creating funding round:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/funding - Delete a funding round and its associated investors
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const roundId = searchParams.get('roundId')

    if (!roundId) {
      return NextResponse.json({ error: 'Round ID is required' }, { status: 400 })
    }

    // Get all investors associated with this round before deleting
    const { data: roundInvestors, error: fetchInvestorsError } = await supabase
      .from('investors')
      .select('id, name, equity_percent')
      .eq('funding_round_id', roundId)
      .eq('user_id', user.id)

    if (fetchInvestorsError) {
      console.error('[Funding API] Error fetching investors:', fetchInvestorsError)
    }

    // Calculate total equity being removed
    const totalInvestorEquity = (roundInvestors || []).reduce((sum: number, inv: any) => {
      return sum + (Number(inv.equity_percent) || 0)
    }, 0)

    console.log(`[Funding API] Deleting funding round ${roundId} with ${roundInvestors?.length || 0} investors (${totalInvestorEquity.toFixed(2)}% equity)`)

    // If investors had equity, redistribute it using cap table BEFORE deleting them
    if (totalInvestorEquity > 0 && roundInvestors && roundInvestors.length > 0) {
      try {
        // Get all active team members
        const { data: teamMembers, error: teamError } = await supabase
          .from('team_members')
          .select('id, name, role, equity_percent')
          .eq('user_id', user.id)
          .eq('is_active', true)

        // Get ALL investors (including the ones we're about to delete)
        // This is important - we need the full current state to redistribute correctly
        const { data: allInvestors, error: investorsError } = await supabase
          .from('investors')
          .select('id, name, equity_percent')
          .eq('user_id', user.id)

        if (!teamError && !investorsError) {
          console.log(`[Funding API] Creating cap table with ${teamMembers?.length || 0} team members and ${allInvestors?.length || 0} investors`)
          
          // Create cap table from FULL current state (including investors we're about to delete)
          const capTable = createCapTableFromData(
            (teamMembers || []).map(m => ({
              id: m.id,
              name: m.name,
              role: m.role,
              equity_percent: Number(m.equity_percent) || 0,
            })),
            (allInvestors || []).map(inv => ({
              id: inv.id,
              name: inv.name,
              equity_percent: Number(inv.equity_percent) || 0,
            }))
          )

          // Remove each investor from the round (this redistributes their equity proportionally)
          for (const investor of roundInvestors) {
            try {
              console.log(`[Funding API] Removing investor ${investor.name} (${investor.equity_percent}% equity) from cap table`)
              capTable.removeEntry(investor.id)
            } catch (err: any) {
              console.error(`[Funding API] Error removing investor ${investor.id} from cap table:`, err)
              throw err // Re-throw to stop the process if cap table removal fails
            }
          }

          // Get updated snapshot after removing investors
          const snapshot = capTable.getSnapshot()
          console.log(`[Funding API] After removing investors - Team equity: ${capTable.getTotalEquityByType('founder') + capTable.getTotalEquityByType('team')}%, Investor equity: ${capTable.getTotalEquityByType('investor')}%, Total: ${snapshot.totalEquity}%`)

          // Update all remaining entries with new equity percentages
          const updatePromises = []
          for (const entry of snapshot.entries) {
            if (entry.type === 'founder' || entry.type === 'team') {
              updatePromises.push(
                supabase
                  .from('team_members')
                  .update({ 
                    equity_percent: entry.equityPercent,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', entry.id)
                  .eq('user_id', user.id)
              )
              console.log(`[Funding API] Updating team member ${entry.name}: ${entry.equityPercent.toFixed(2)}%`)
            } else if (entry.type === 'investor') {
              // Only update investors that aren't being deleted
              if (!roundInvestors.find(ri => ri.id === entry.id)) {
                updatePromises.push(
                  supabase
                    .from('investors')
                    .update({ 
                      equity_percent: entry.equityPercent,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', entry.id)
                    .eq('user_id', user.id)
                )
                console.log(`[Funding API] Updating remaining investor ${entry.name}: ${entry.equityPercent.toFixed(2)}%`)
              }
            }
          }

          // Wait for all updates to complete
          const updateResults = await Promise.all(updatePromises)
          const errors = updateResults.filter(r => r.error)
          if (errors.length > 0) {
            console.error('[Funding API] Some equity updates failed:', errors)
            throw new Error(`Failed to update ${errors.length} equity entries`)
          }

          console.log(`[Funding API] Successfully redistributed ${totalInvestorEquity.toFixed(2)}% equity. New total: ${snapshot.totalEquity.toFixed(2)}%`)
        } else {
          console.error('[Funding API] Error loading team members or investors:', teamError || investorsError)
        }
      } catch (capTableError: any) {
        console.error('[Funding API] Error redistributing equity:', capTableError)
        // Don't continue with deletion if equity redistribution fails - this could corrupt the cap table
        return NextResponse.json({ 
          error: `Failed to redistribute equity: ${capTableError.message || 'Unknown error'}` 
        }, { status: 500 })
      }
    } else if (roundInvestors && roundInvestors.length > 0) {
      console.log(`[Funding API] Investors have no equity (${totalInvestorEquity}%), skipping redistribution`)
    }

    // Delete all investors associated with this round
    const { error: investorsDeleteError } = await supabase
      .from('investors')
      .delete()
      .eq('funding_round_id', roundId)
      .eq('user_id', user.id)

    if (investorsDeleteError) {
      console.error('Error deleting investors:', investorsDeleteError)
      // Continue with round deletion even if investor deletion fails
    }

    // Then delete the funding round
    const { error: roundDeleteError } = await supabase
      .from('funding_rounds')
      .delete()
      .eq('id', roundId)
      .eq('user_id', user.id)

    if (roundDeleteError) throw roundDeleteError

    const deletedInvestorsCount = roundInvestors?.length || 0
    return NextResponse.json({ 
      success: true, 
      message: 'Funding round deleted and equity redistributed',
      deletedInvestors: deletedInvestorsCount,
      redistributedEquity: totalInvestorEquity
    })
  } catch (error: any) {
    console.error('Error deleting funding round:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
