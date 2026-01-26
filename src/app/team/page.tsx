'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'
import EquityAdjustmentModal from '@/components/EquityAdjustmentModal'
import AddTeamMemberModal from '@/components/AddTeamMemberModal'

interface TeamMember {
  id: string
  name: string
  role: string
  title: string
  equity_percent: number
  vested_percent: number
  avatar_url: string | null
  email: string | null
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [refreshKey, setRefreshKey] = useState(0) // Force re-render key
  const [showAddModal, setShowAddModal] = useState(false)
  const [investorEquity, setInvestorEquity] = useState(0)

  useEffect(() => {
    loadTeam()
  }, [])

  const recalculateEquity = async () => {
    try {
      console.log('[Team Page] Triggering equity recalculation...')
      const res = await fetch('/api/equity/recalculate', {
        method: 'POST'
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('[Team Page] Recalculation successful:', data)
        
        // Force a complete reload of all data with cache busting
        setLoading(true)
        
        // Add timestamp to bust cache
        const timestamp = Date.now()
        
        // Fetch fresh team data (no cache)
        const teamRes = await fetch(`/api/team?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        const teamData = await teamRes.json()
        const freshTeamMembers = teamData.teamMembers || []
        console.log('[Team Page] Fresh team members:', freshTeamMembers.map((m: any) => ({ name: m.name, equity: m.equity_percent })))
        
        // Fetch fresh investor data (no cache)
        const investorsRes = await fetch(`/api/investors?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        }).catch(() => ({ json: () => ({ investors: [] }) }))
        const investorsData = await investorsRes.json()
        const allInvestors = investorsData.investors || []
        
        // Filter to only valid investors (API should already do this, but double-check)
        const freshInvestors = allInvestors.filter((inv: any) => {
          return inv.funding_round_id !== null && inv.funding_round_id !== undefined
        })
        
        console.log('[Team Page] Fresh investors:', freshInvestors.length, 'valid out of', allInvestors.length, 'total')
        
        // Calculate fresh investor equity from valid investors only
        const freshInvestorEquity = freshInvestors.reduce((sum: number, inv: any) => {
          return sum + (Number(inv.equity_percent) || 0)
        }, 0)
        
        console.log('[Team Page] Fresh totals - Team:', freshTeamMembers.reduce((s: number, m: any) => s + (Number(m.equity_percent) || 0), 0), 'Investors:', freshInvestorEquity)
        
        // Update all state at once
        setTeamMembers([...freshTeamMembers]) // Create new array to force re-render
        setInvestorEquity(freshInvestorEquity)
        setRefreshKey(prev => prev + 1) // Force component re-render
        
        // Small delay to ensure state updates before setting loading to false
        await new Promise(resolve => setTimeout(resolve, 100))
        setLoading(false)
        
        console.log('[Team Page] State updated - Team members:', freshTeamMembers.length, 'Investor equity:', freshInvestorEquity)
        console.log('[Team Page] Team member equity:', freshTeamMembers.map((m: any) => `${m.name}: ${m.equity_percent}%`))
      } else {
        const error = await res.json()
        console.error('[Team Page] Recalculation failed:', error)
        alert(`Failed to recalculate equity: ${error.error || 'Unknown error'}`)
        setLoading(false)
      }
    } catch (error: any) {
      console.error('[Team Page] Error recalculating equity:', error)
      alert(`Error recalculating equity: ${error.message || 'Unknown error'}`)
      setLoading(false)
    }
  }

  // Recalculate equity once after initial load
  const [hasRecalculated, setHasRecalculated] = useState(false)
  useEffect(() => {
    if (!loading && teamMembers.length > 0 && !hasRecalculated) {
      // Only recalculate once on mount
      const timer = setTimeout(() => {
        recalculateEquity()
        setHasRecalculated(true)
      }, 500) // Small delay to ensure all data is loaded
      return () => clearTimeout(timer)
    }
  }, [loading]) // Only depend on loading to avoid loops

  const loadTeam = async () => {
    try {
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setUser(profileData)

      const [teamRes, investorsRes] = await Promise.all([
        fetch('/api/team'),
        fetch('/api/investors').catch(() => ({ json: () => ({ investors: [] }) }))
      ])
      
      const data = await teamRes.json()
      let teamMembers = data.teamMembers || []
      
      // Fetch investors for equity calculation
      const investorsData = await investorsRes.json()
      const investors = investorsData.investors || []
      
      // Filter to only valid investors (API should already do this, but double-check)
      // Investors should have a valid funding_round_id that matches an existing round
      const validInvestors = investors.filter((inv: any) => {
        // If investor has no funding_round_id, exclude it (orphaned)
        return inv.funding_round_id !== null && inv.funding_round_id !== undefined
      })
      
      // Calculate total investor equity from valid investors only
      const totalInvestorEquity = validInvestors.reduce((sum: number, inv: any) => {
        return sum + (Number(inv.equity_percent) || 0)
      }, 0)
      
      console.log(`[Team Page] Loaded ${validInvestors.length} valid investors (${investors.length} total), equity: ${totalInvestorEquity.toFixed(2)}%`)
      setInvestorEquity(totalInvestorEquity)
      
      // Check if current user has a team_members entry by matching email
      // (All team members have the same user_id, so we match by email to find the user's own entry)
      const userTeamMember = teamMembers.find((m: any) => 
        m.email === profileData.email || 
        (profileData.email && m.email?.toLowerCase() === profileData.email.toLowerCase())
      )
      
      if (!userTeamMember && profileData.id) {
        // Create team_members entry for current user
        try {
          const createRes = await fetch('/api/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: profileData.name || profileData.email?.split('@')[0] || 'You',
              email: profileData.email,
              role: 'Founder',
              title: profileData.position || 'Founder',
              equity_percent: 0,
              vested_percent: 0,
              start_date: new Date().toISOString()
            })
          })
          if (createRes.ok) {
            // Reload team after creating user entry
            const reloadRes = await fetch('/api/team')
            const reloadData = await reloadRes.json()
            teamMembers = reloadData.teamMembers || []
          }
        } catch (err) {
          console.error('Error creating user team member:', err)
        }
      }
      
      setTeamMembers(teamMembers)
      
      // Check if equity totals are valid and auto-fix if needed
      const totalTeamEquity = teamMembers.reduce((sum: number, m: any) => sum + (Number(m.equity_percent) || 0), 0)
      const totalEquity = totalTeamEquity + totalInvestorEquity
      
      // If total is significantly off (more than 0.5% error) or if there are no investors but team equity < 100%, auto-recalculate
      const shouldRecalculate = Math.abs(totalEquity - 100) > 0.5 && totalEquity > 0
      const noInvestorsButIncomplete = totalInvestorEquity === 0 && totalTeamEquity < 99.5 && teamMembers.length > 0
      
      if (shouldRecalculate || noInvestorsButIncomplete) {
        console.warn(`[Team Page] Equity total is ${totalEquity.toFixed(2)}% (Team: ${totalTeamEquity.toFixed(2)}%, Investors: ${totalInvestorEquity.toFixed(2)}%), auto-recalculating...`)
        try {
          const recalcRes = await fetch('/api/equity/recalculate', { method: 'POST' })
          if (recalcRes.ok) {
            // Reload team data after recalculation
            const reloadRes = await fetch('/api/team')
            const reloadData = await reloadRes.json()
            setTeamMembers(reloadData.teamMembers || [])
            
            const reloadInvestorsRes = await fetch('/api/investors').catch(() => ({ json: () => ({ investors: [] }) }))
            const reloadInvestorsData = await reloadInvestorsRes.json()
            const reloadInvestors = reloadInvestorsData.investors || []
            const newTotalInvestorEquity = reloadInvestors.reduce((sum: number, inv: any) => sum + (Number(inv.equity_percent) || 0), 0)
            setInvestorEquity(newTotalInvestorEquity)
          }
        } catch (err) {
          console.error('Error auto-recalculating equity:', err)
        }
      }
    } catch (error) {
      console.error('Error loading team:', error)
    } finally {
      setLoading(false)
    }
  }

  // Recalculate equity breakdown whenever teamMembers or investorEquity changes
  const founderCount = teamMembers.filter(m => m.role === 'Founder' || m.role === 'Co-Founder').length
  const founderEquity = teamMembers
    .filter(m => m.role === 'Founder' || m.role === 'Co-Founder')
    .reduce((sum, m) => sum + (Number(m.equity_percent) || 0), 0)

  // Calculate total equity allocated to all team members (including founders)
  const totalAllocated = teamMembers.reduce((sum, m) => sum + (Number(m.equity_percent) || 0), 0)

  // Calculate employee pool (non-founder, non-co-founder equity)
  const employeePoolEquity = teamMembers
    .filter(m => m.role !== 'Founder' && m.role !== 'Co-Founder')
    .reduce((sum, m) => sum + (Number(m.equity_percent) || 0), 0)

  // Calculate total equity (team + investors)
  const totalEquity = totalAllocated + investorEquity

  // Calculate remaining equity (assuming 100% total)
  // Cap at 0 to avoid negative values if there's an error
  const reservedEquity = Math.max(0, 100 - totalEquity)

  // If total exceeds 100%, we have a data integrity issue - normalize for display
  const displayFounderEquity = totalEquity > 100.01 ? (founderEquity / totalEquity * 100) : founderEquity
  const displayEmployeePool = totalEquity > 100.01 ? (employeePoolEquity / totalEquity * 100) : employeePoolEquity
  const displayInvestorEquity = totalEquity > 100.01 ? (investorEquity / totalEquity * 100) : investorEquity
  const displayReserved = totalEquity > 100.01 ? 0 : reservedEquity

  // Debug logging when equity values change
  useEffect(() => {
    if (!loading && teamMembers.length > 0) {
      console.log('[Team Page] Equity breakdown updated:', {
        teamMembers: teamMembers.length,
        founderEquity: founderEquity.toFixed(2),
        totalAllocated: totalAllocated.toFixed(2),
        investorEquity: investorEquity.toFixed(2),
        totalEquity: totalEquity.toFixed(2),
        refreshKey
      })
    }
  }, [teamMembers, investorEquity, loading, refreshKey, founderEquity, totalAllocated, totalEquity])

  const handleEquityUpdate = async (memberId: string, updates: Partial<TeamMember>) => {
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, ...updates })
      })

      if (res.ok) {
        const data = await res.json()
        
        // Update local state and reload to get fresh data
        setTeamMembers(prev =>
          prev.map(m => m.id === memberId ? { ...m, ...updates } : m)
        )
        loadTeam() // Reload to get updated data including vesting schedules
      } else {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update team member')
      }
    } catch (error: any) {
      console.error('Error updating team member:', error)
      alert(error.message || 'Failed to update team member')
    }
  }

  const handleAddMember = async (memberData: any) => {
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to add team member')
    }

    const data = await res.json()
    setTeamMembers(prev => [...prev, data.teamMember])
    loadTeam() // Reload to get full data
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/team?memberId=${memberId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to remove team member')
      }

      // Remove from local state
      setTeamMembers(prev => prev.filter(m => m.id !== memberId))
      if (selectedMember?.id === memberId) {
        setSelectedMember(null)
      }
      loadTeam() // Reload to refresh data
    } catch (error: any) {
      console.error('Error deleting team member:', error)
      alert(error.message || 'Failed to remove team member')
    }
  }


  // Find the current user's team_members entry by matching email
  // (All team members have the same user_id, so we match by email to find the user's own entry)
  const userTeamMember = teamMembers.find((m: any) => 
    user?.email && (m.email === user.email || m.email?.toLowerCase() === user.email.toLowerCase())
  )

  // Combine user and team members for display, with user always at the top
  const allMembers = userTeamMember ? [
    {
      ...userTeamMember,
      isCurrentUser: true
    },
    ...teamMembers.filter((m: any) => m.id !== userTeamMember.id)
  ] : teamMembers

  return (
    <AppLayout user={user}>
      <PageBackground>
        <div className="p-4 sm:p-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0"
          >
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-black dark:text-white leading-tight">
              Team & Equity
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Manage your team and track equity distribution
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors w-full sm:w-auto"
          >
            + Add Team Member
          </button>
          </motion.div>

          {/* Stats Row - Responsive */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-zinc-950 rounded-lg p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800"
            >
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Team Members</div>
            <div className="text-2xl font-medium text-black dark:text-white">
              {allMembers.length}
            </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-zinc-950 rounded-lg p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Founders</div>
            <div className="text-2xl font-medium text-black dark:text-white">
              {founderCount}
            </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-zinc-950 rounded-lg p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Founder Equity</div>
            <div className="text-2xl font-medium text-black dark:text-white">
              {founderEquity.toFixed(1)}%
            </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-zinc-950 rounded-lg p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Employee Pool</div>
            <div className="text-2xl font-medium text-black dark:text-white">
              {employeePoolEquity.toFixed(1)}%
            </div>
            </motion.div>
          </motion.div>

          {/* Main Grid - Responsive */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {/* Team Members List */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-black dark:text-white">
                Team Members
              </h3>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8 text-zinc-500">Loading...</div>
              ) : allMembers.length > 0 ? (
                <div className="space-y-0">
                  {allMembers.map((member: any, index: number) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedMember(member)}
                      className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-zinc-800 dark:bg-zinc-800 flex items-center justify-center text-white font-semibold text-sm">
                              {member.name.charAt(0)}
                            </div>
                          )}
                          {/* Orange ring for Founders/Co-Founders */}
                          {(member.role === 'Founder' || member.role === 'Co-Founder') && (
                            <div className="absolute inset-0 rounded-full border-2 border-orange-500 pointer-events-none" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm text-black dark:text-white">
                              {member.name}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              member.role === 'Founder' || member.role === 'Co-Founder'
                                ? 'bg-black dark:bg-white text-white dark:text-black' 
                                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">
                            {member.title || member.role}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-base font-medium text-black dark:text-white">
                            {member.equity_percent}%
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">equity</div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          <div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                              Vested
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 sm:w-24 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${member.vested_percent}%` }}
                                  transition={{ duration: 0.5, delay: 0.2 }}
                                  className="h-full bg-orange-500"
                                />
                              </div>
                              <span className="text-xs font-normal text-black dark:text-white whitespace-nowrap">
                                {member.vested_percent}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                          {member.email && (
                            <button 
                              className="p-1.5 sm:p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = `mailto:${member.email}`
                              }}
                              title="Send email"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                          {!member.isCurrentUser && (
                            <button 
                              className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteMember(member.id)
                              }}
                              title="Remove team member"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-zinc-500 dark:text-zinc-400 mb-4">No team members yet</p>
                  <button className="text-sm text-black dark:text-white hover:underline">
                    Add your first team member
                  </button>
                </div>
              )}
            </div>
            </motion.div>

          {/* Right Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Equity Breakdown */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  Equity Breakdown
                </h3>
              </div>
              <div className="p-4">
                {teamMembers.length > 0 ? (
                  <>
                    {/* Equity Bar */}
                    <div className="h-8 rounded-lg overflow-hidden flex mb-4">
                      {displayFounderEquity > 0 && (
                        <div className="bg-black dark:bg-white" style={{ width: `${displayFounderEquity}%` }} title="Founders" />
                      )}
                      {displayEmployeePool > 0 && (
                        <div className="bg-orange-400" style={{ width: `${displayEmployeePool}%` }} title="Employee Pool" />
                      )}
                      {displayInvestorEquity > 0 && (
                        <div className="bg-zinc-400 dark:bg-zinc-600" style={{ width: `${displayInvestorEquity}%` }} title="Investors" />
                      )}
                      {displayReserved > 0 && (
                        <div className="bg-zinc-200 dark:bg-zinc-800" style={{ width: `${displayReserved}%` }} title="Unallocated" />
                      )}
                    </div>
                    

                    {/* Legend */}
                    <div className="space-y-2">
                      {displayFounderEquity > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-black dark:bg-white" />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">Founders</span>
                          </div>
                          <span className="text-sm font-normal text-black dark:text-white">
                            {displayFounderEquity.toFixed(1)}%
                          </span>
                        </div>
                      )}

                      {displayEmployeePool > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-orange-400" />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">Employee Pool</span>
                          </div>
                          <span className="text-sm font-normal text-black dark:text-white">
                            {displayEmployeePool.toFixed(1)}%
                          </span>
                        </div>
                      )}

                      {displayInvestorEquity > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-zinc-400 dark:bg-zinc-600" />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">Investors</span>
                          </div>
                          <span className="text-sm font-normal text-black dark:text-white">
                            {displayInvestorEquity.toFixed(1)}%
                          </span>
                        </div>
                      )}

                      {displayReserved > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">Unallocated</span>
                          </div>
                          <span className="text-sm font-normal text-black dark:text-white">{displayReserved.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    No equity data yet. Add team members to see breakdown.
                  </div>
                )}
              </div>
            </motion.div>

            {/* Vesting Schedule */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  Vesting Schedule
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-black dark:text-white text-sm">
                      4-Year Vesting
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Standard vesting period for all equity
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-black dark:text-white text-sm">
                      1-Year Cliff
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      25% vests after first year
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Monthly vesting after cliff period. All equity subject to standard single-trigger acceleration.
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
        </div>
      </PageBackground>

      {/* Equity Adjustment Modal */}
      {selectedMember && (
        <EquityAdjustmentModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onSave={handleEquityUpdate}
        />
      )}

      {/* Add Team Member Modal */}
      {showAddModal && (
        <AddTeamMemberModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddMember}
        />
      )}

    </AppLayout>
  )
}
