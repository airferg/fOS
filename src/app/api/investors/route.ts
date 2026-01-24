import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CapTable, createCapTableFromData } from '@/lib/cap-table'

/**
 * GET /api/investors - Get all investors (only those with valid funding rounds)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all funding rounds first
    const { data: rounds, error: roundsError } = await supabase
      .from('funding_rounds')
      .select('id')
      .eq('user_id', user.id)

    if (roundsError) throw roundsError

    const validRoundIds = new Set((rounds || []).map((r: any) => r.id))

    // Get all investors
    const { data: allInvestors, error } = await supabase
      .from('investors')
      .select('*')
      .eq('user_id', user.id)
      .order('investment_date', { ascending: false })

    if (error) throw error

    // Filter to only include investors with valid funding rounds (or null funding_round_id for backwards compatibility)
    // If there are no funding rounds, don't return any investors
    const validInvestors = (allInvestors || []).filter((inv: any) => {
      // If no funding rounds exist, exclude all investors
      if (validRoundIds.size === 0) {
        return false
      }
      // Include investors with valid funding_round_id or null (for backwards compatibility)
      return !inv.funding_round_id || validRoundIds.has(inv.funding_round_id)
    })

    // Log orphaned investors for debugging
    const orphanedInvestors = (allInvestors || []).filter((inv: any) => 
      inv.funding_round_id && !validRoundIds.has(inv.funding_round_id)
    )
    if (orphanedInvestors.length > 0) {
      console.warn(`[Investors API] Found ${orphanedInvestors.length} orphaned investors (funding round deleted):`, 
        orphanedInvestors.map((inv: any) => ({ id: inv.id, name: inv.name, round_id: inv.funding_round_id }))
      )
    }

    const totalInvestorEquity = validInvestors.reduce((sum: number, inv: any) => sum + (Number(inv.equity_percent) || 0), 0)
    console.log(`[Investors API] Returning ${validInvestors.length} valid investors (${allInvestors?.length || 0} total, ${orphanedInvestors.length} orphaned), total equity: ${totalInvestorEquity.toFixed(2)}%`)
    
    return NextResponse.json({ investors: validInvestors }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Error fetching investors:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/investors - Create a new investor
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    let { name, firm, investment_amount, equity_percent, funding_round_id, investment_date, investor_type, equity_type, is_lead, notes } = body

    // Map investor_type to valid database values
    // Database constraint allows: angel, vc, corporate, strategic
    // We store additional types (angel_network, grant) as base type + notes
    const investorTypeMap: Record<string, string> = {
      'angel': 'angel',
      'angel_network': 'angel',  // Map to angel, store 'Angel Network' in notes
      'vc': 'vc',
      'corporate': 'corporate',
      'strategic': 'strategic',
      'grant': 'strategic',  // Map grants to strategic, store 'Grant' in notes
    }

    const normalizedInvestorType = investorTypeMap[investor_type?.toLowerCase()] || 'angel'
    const originalInvestorType = investor_type

    // Build notes field with equity type and original investor type if mapped
    let investorNotes = notes || ''

    // Store original investor type if it was mapped to something different
    if (originalInvestorType && originalInvestorType !== normalizedInvestorType) {
      const typeLabel = originalInvestorType === 'angel_network' ? 'Angel Network' :
                        originalInvestorType === 'grant' ? 'Grant' : originalInvestorType
      investorNotes = investorNotes ? `${investorNotes}\nInvestor Type: ${typeLabel}` : `Investor Type: ${typeLabel}`
    }
    if (equity_type && equity_type !== 'equity') {
      investorNotes = investorNotes ? `${investorNotes}\nEquity Type: ${equity_type}` : `Equity Type: ${equity_type}`
    }

    // Create investor
    console.log('[Investors API] Creating investor:', { name, firm, funding_round_id, investment_amount, equity_percent })
    
    // Track final equity percent (may be adjusted by cap table)
    let finalEquityPercent = equity_percent || 0
    
    // If investor is getting equity, use cap table to handle dilution properly
    if (equity_percent && equity_percent > 0) {
      // Get all existing team members
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('id, name, role, equity_percent')
        .eq('user_id', user.id)
        .eq('is_active', true)

      // Get all existing investors
      const { data: existingInvestors, error: investorsError } = await supabase
        .from('investors')
        .select('id, name, equity_percent')
        .eq('user_id', user.id)

      if (teamError || investorsError) {
        return NextResponse.json({ 
          error: 'Failed to load existing cap table data' 
        }, { status: 500 })
      }

      try {
        // Create cap table from existing data
        const capTable = createCapTableFromData(
          (teamMembers || []).map(m => ({
            id: m.id,
            name: m.name,
            role: m.role,
            equity_percent: Number(m.equity_percent) || 0,
          })),
          (existingInvestors || []).map(inv => ({
            id: inv.id,
            name: inv.name,
            equity_percent: Number(inv.equity_percent) || 0,
          }))
        )

        // Add new investor (this will automatically dilute existing shareholders)
        capTable.addEntry({
          id: `temp-${Date.now()}`, // Temporary ID, will be replaced after insert
          type: 'investor',
          name: name,
          equityPercent: equity_percent,
        })

        // Get updated entries from cap table
        const snapshot = capTable.getSnapshot()
        console.log(`[Investors API] Cap table updated. New total: ${snapshot.totalEquity}%`)

        // Update all team members with new diluted percentages
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
          } else if (entry.type === 'investor' && entry.id.startsWith('temp-')) {
            // This is the new investor - will be inserted below
            continue
          } else if (entry.type === 'investor') {
            // Update existing investors
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

        // Get the new investor's equity from cap table (may be adjusted during normalization)
        const newInvestorEntry = snapshot.entries.find(e => e.id.startsWith('temp-'))
        if (newInvestorEntry) {
          finalEquityPercent = newInvestorEntry.equityPercent
        }
      } catch (error: any) {
        console.error('[Investors API] Cap table error:', error)
        return NextResponse.json({ 
          error: error.message || 'Failed to calculate equity allocation' 
        }, { status: 400 })
      }
    }
    
    const { data: investor, error } = await supabase
      .from('investors')
      .insert({
        user_id: user.id,
        name,
        firm: firm || null,
        investment_amount: investment_amount || 0,
        equity_percent: finalEquityPercent,
        funding_round_id: funding_round_id || null,
        investment_date: investment_date || new Date().toISOString().split('T')[0],
        investor_type: normalizedInvestorType,
        notes: investorNotes || null,
        is_lead: is_lead || false
      })
      .select()
      .single()

    if (error) {
      console.error('[Investors API] Error creating investor:', error)
      throw error
    }
    
    console.log('[Investors API] Investor created successfully:', investor.id, 'with funding_round_id:', investor.funding_round_id)

    // Update investor count on funding round
    if (funding_round_id) {
      const { data: round } = await supabase
        .from('funding_rounds')
        .select('investor_count')
        .eq('id', funding_round_id)
        .single()

      if (round) {
        await supabase
          .from('funding_rounds')
          .update({ investor_count: (round.investor_count || 0) + 1 })
          .eq('id', funding_round_id)
      }
    }

    return NextResponse.json({ investor })
  } catch (error: any) {
    console.error('Error creating investor:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: error.message || error.code || JSON.stringify(error) || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/investors - Update an investor (and adjust dilution)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { investorId, equity_percent, ...otherUpdates } = body

    if (!investorId) {
      return NextResponse.json({ error: 'Investor ID is required' }, { status: 400 })
    }

    // Get the current investor to calculate equity change
    const { data: currentInvestor } = await supabase
      .from('investors')
      .select('equity_percent')
      .eq('id', investorId)
      .eq('user_id', user.id)
      .single()

    if (!currentInvestor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
    }

    const oldEquity = Number(currentInvestor.equity_percent) || 0
    const newEquity = equity_percent ? Number(equity_percent) : oldEquity
    const equityChange = newEquity - oldEquity

    // If equity changed, adjust dilution for all other shareholders
    if (equityChange !== 0) {
      const dilutionFactor = 1 - (equityChange / 100)
      
      // Dilute team members
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('id, equity_percent')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (teamMembers && teamMembers.length > 0) {
        for (const member of teamMembers) {
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

      // Dilute other investors
      const { data: otherInvestors } = await supabase
        .from('investors')
        .select('id, equity_percent')
        .eq('user_id', user.id)
        .neq('id', investorId)

      if (otherInvestors && otherInvestors.length > 0) {
        for (const inv of otherInvestors) {
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

    // Update the investor
    const updateData: any = {
      updated_at: new Date().toISOString(),
      ...otherUpdates
    }
    if (equity_percent !== undefined) updateData.equity_percent = equity_percent

    const { data: investor, error } = await supabase
      .from('investors')
      .update(updateData)
      .eq('id', investorId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ investor })
  } catch (error: any) {
    console.error('Error updating investor:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/investors - Delete an investor (and reverse dilution)
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const investorId = searchParams.get('investorId')

    if (!investorId) {
      return NextResponse.json({ error: 'Investor ID is required' }, { status: 400 })
    }

    // Get the investor's equity before deleting
    const { data: investor } = await supabase
      .from('investors')
      .select('equity_percent, funding_round_id')
      .eq('id', investorId)
      .eq('user_id', user.id)
      .single()

    if (!investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
    }

    const investorEquity = Number(investor.equity_percent) || 0

    // Delete the investor
    const { error: deleteError } = await supabase
      .from('investors')
      .delete()
      .eq('id', investorId)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    // Reverse dilution: if investor had equity, redistribute it proportionally
    if (investorEquity > 0) {
      // Calculate anti-dilution factor: 1 / (1 - investor_percentage)
      const antiDilutionFactor = 1 / (1 - (investorEquity / 100))

      // Reverse dilute team members
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('id, equity_percent')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (teamMembers && teamMembers.length > 0) {
        for (const member of teamMembers) {
          const oldEquity = Number(member.equity_percent) || 0
          const newEquity = oldEquity * antiDilutionFactor
          await supabase
            .from('team_members')
            .update({ 
              equity_percent: Math.round(newEquity * 100) / 100,
              updated_at: new Date().toISOString()
            })
            .eq('id', member.id)
            .eq('user_id', user.id)
        }
      }

      // Reverse dilute other investors
      const { data: otherInvestors } = await supabase
        .from('investors')
        .select('id, equity_percent')
        .eq('user_id', user.id)

      if (otherInvestors && otherInvestors.length > 0) {
        for (const inv of otherInvestors) {
          const oldEquity = Number(inv.equity_percent) || 0
          const newEquity = oldEquity * antiDilutionFactor
          await supabase
            .from('investors')
            .update({ 
              equity_percent: Math.round(newEquity * 100) / 100,
              updated_at: new Date().toISOString()
            })
            .eq('id', inv.id)
            .eq('user_id', user.id)
        }
      }

      // Update investor count on funding round
      if (investor.funding_round_id) {
        const { data: round } = await supabase
          .from('funding_rounds')
          .select('investor_count')
          .eq('id', investor.funding_round_id)
          .single()

        if (round) {
          await supabase
            .from('funding_rounds')
            .update({ investor_count: Math.max(0, (round.investor_count || 0) - 1) })
            .eq('id', investor.funding_round_id)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting investor:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
