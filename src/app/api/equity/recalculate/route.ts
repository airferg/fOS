import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createCapTableFromData } from '@/lib/cap-table'

/**
 * POST /api/equity/recalculate - Recalculate and normalize equity percentages
 * This ensures all equity adds up to exactly 100%
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all investors
    const { data: investors, error: investorsError } = await supabase
      .from('investors')
      .select('id, name, equity_percent, funding_round_id')
      .eq('user_id', user.id)

    if (investorsError) throw investorsError

    // Get all funding rounds to filter valid investors
    const { data: rounds } = await supabase
      .from('funding_rounds')
      .select('id')
      .eq('user_id', user.id)

    const validRoundIds = new Set((rounds || []).map((r: any) => r.id))
    const validInvestors = (investors || []).filter((inv: any) => 
      inv.funding_round_id && validRoundIds.has(inv.funding_round_id)
    )

    // Get all team members
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('id, name, role, equity_percent')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (teamError) throw teamError

    // Create cap table from existing data
    const capTable = createCapTableFromData(
      (teamMembers || []).map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        equity_percent: Number(m.equity_percent) || 0,
      })),
      validInvestors.map(inv => ({
        id: inv.id,
        name: inv.name,
        equity_percent: Number(inv.equity_percent) || 0,
      }))
    )

    // Always recalculate to ensure normalization (handles edge cases)
    const validation = capTable.validate()
    const currentTotal = validation.total
    
    console.log(`[Equity Recalc] Current total: ${currentTotal.toFixed(2)}%`)
    console.log(`[Equity Recalc] Team members: ${teamMembers.length}, Investors: ${validInvestors.length}`)
    
    if (currentTotal <= 0) {
      return NextResponse.json({ 
        error: `Invalid cap table: Total equity is ${currentTotal}%` 
      }, { status: 400 })
    }

    // Special case: If there's only one team member and no investors, they should have 100%
    if (teamMembers.length === 1 && validInvestors.length === 0) {
      const singleMember = teamMembers[0]
      console.log(`[Equity Recalc] Special case: Single team member (${singleMember.name}), setting to 100%`)
      await supabase
        .from('team_members')
        .update({ 
          equity_percent: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', singleMember.id)
        .eq('user_id', user.id)
      
      return NextResponse.json({ 
        success: true,
        message: 'Equity recalculated',
        totals: {
          team: 100,
          investors: 0,
          total: 100
        }
      })
    }

    // Always normalize to 100% (even if close, to handle rounding issues)
    if (Math.abs(currentTotal - 100) > 0.01) {
      console.log(`[Equity Recalc] Normalizing from ${currentTotal.toFixed(2)}% to 100%`)
      capTable.recalculate()
    } else {
      console.log(`[Equity Recalc] Equity already at 100%, but recalculating to ensure consistency`)
      capTable.recalculate() // Still recalculate to ensure shares are correct
    }

    // Get normalized snapshot
    const snapshot = capTable.getSnapshot()
    const totalTeamEquity = capTable.getTotalEquityByType('founder') + capTable.getTotalEquityByType('team')
    const totalInvestorEquity = capTable.getTotalEquityByType('investor')

    console.log(`[Equity Recalc] After normalization - Team: ${totalTeamEquity.toFixed(2)}%, Investors: ${totalInvestorEquity.toFixed(2)}%, Total: ${snapshot.totalEquity.toFixed(2)}%`)
    console.log(`[Equity Recalc] Updating ${snapshot.entries.length} entries in database`)

    // Update all entries in database
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
        console.log(`[Equity Recalc] Updating team member ${entry.name}: ${entry.equityPercent.toFixed(2)}%`)
      } else if (entry.type === 'investor') {
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
        console.log(`[Equity Recalc] Updating investor ${entry.name}: ${entry.equityPercent.toFixed(2)}%`)
      }
    }

    // Wait for all updates to complete
    const updateResults = await Promise.all(updatePromises)
    const errors = updateResults.filter(r => r.error)
    
    if (errors.length > 0) {
      console.error('[Equity Recalc] Some updates failed:', errors)
      throw new Error(`Failed to update ${errors.length} entries`)
    }

    console.log(`[Equity Recalc] Successfully updated ${snapshot.entries.length} entries. New total: ${snapshot.totalEquity.toFixed(2)}%`)

    return NextResponse.json({ 
      success: true,
      message: 'Equity recalculated',
      totals: {
        team: totalTeamEquity,
        investors: totalInvestorEquity,
        total: snapshot.totalEquity
      }
    })
  } catch (error: any) {
    console.error('Error recalculating equity:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
