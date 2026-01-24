'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'
import AddFundingRoundModal from '@/components/AddFundingRoundModal'
import DocumentUploadModal from '@/components/DocumentUploadModal'
import { useCountUp } from '@/hooks/useCountUp'
import { FileText, ExternalLink, Calendar, BarChart3 } from '@/components/ui/icons'

interface FundingRound {
  id: string
  round_name: string
  round_type?: string
  amount_raised: number
  close_date: string
  status: 'planned' | 'raising' | 'closed'
  lead_investor?: string
}

interface Investor {
  id: string
  name: string
  email: string | null
  firm?: string | null
  investment_amount: number
  equity_percent?: number
  round_name: string
  funding_round_id?: string
  investor_type?: string
  investment_date: string | null
  notes?: string | null
  is_lead?: boolean
}

interface Document {
  id: string
  title: string
  created_at: string
  url?: string
}

// Hardcoded documents from screenshot
const hardcodedDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'SAFE Agreement - Sequoia',
    created_at: '2024-03-15',
    url: '#'
  },
  {
    id: 'doc-2',
    title: 'Term Sheet - Seed Round',
    created_at: '2024-02-28',
    url: '#'
  },
  {
    id: 'doc-3',
    title: 'Cap Table - Current',
    created_at: '2024-03-20',
    url: '#'
  },
  {
    id: 'doc-4',
    title: 'Financial Projections 2024',
    created_at: '2024-01-10',
    url: '#'
  }
]

export default function FundingPage() {
  const [rounds, setRounds] = useState<FundingRound[]>([])
  const [investors, setInvestors] = useState<Investor[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [stats, setStats] = useState({
    totalRaised: 0,
    currentRunway: 0, // months
    monthlyBurn: 0,
    cashRemaining: 0
  })
  
  // Animated values for smooth transitions
  const animatedTotalRaised = useCountUp(stats.totalRaised, 1500)
  const animatedRunway = useCountUp(stats.currentRunway, 1500)
  const animatedCashRemaining = useCountUp(stats.cashRemaining, 1500)
  const [monthlyBurnInput, setMonthlyBurnInput] = useState<string>('')
  const [showBurnModal, setShowBurnModal] = useState(false)

  useEffect(() => {
    loadFundingData()
  }, [])

  const loadFundingData = async () => {
    try {
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setUser(profileData)

      const res = await fetch('/api/funding')
      const data = await res.json()

      const roundsData = (data.rounds || []).map((round: any) => ({
        id: round.id,
        round_name: round.round_name,
        round_type: round.round_type,
        amount_raised: Number(round.amount_raised) || 0,
        close_date: round.close_date,
        status: round.status || 'planned',
        lead_investor: round.lead_investor
      }))

      // Filter out investors that don't belong to any existing round (orphaned investors)
      const validRoundIds = new Set(roundsData.map((r: FundingRound) => r.id))

      const investorsData = (data.investors || [])
        .filter((inv: any) => {
          // Only include investors that have a funding_round_id that matches an existing round
          return inv.funding_round_id && validRoundIds.has(inv.funding_round_id)
        })
        .map((inv: any) => {
          // Handle nested funding_rounds data from Supabase
          const round = inv.funding_rounds || roundsData.find((r: FundingRound) => r.id === inv.funding_round_id)
          return {
            id: inv.id,
            name: inv.name,
            email: inv.email,
            firm: inv.firm,
            investment_amount: Number(inv.investment_amount) || 0,
            equity_percent: Number(inv.equity_percent) || 0,
            round_name: round?.round_name || inv.round_name || 'Pre-Seed',
            funding_round_id: inv.funding_round_id,
            investor_type: inv.investor_type || 'angel',
            investment_date: inv.investment_date,
            notes: inv.notes,
            is_lead: inv.is_lead || false
          }
        })

      setRounds(roundsData)
      setInvestors(investorsData)

      // Calculate stats from actual data - count closed and raising rounds (committed money)
      // Planned rounds don't count as they're not yet committed
      const totalRaised = roundsData
        .filter((r: FundingRound) => r.status === 'closed' || r.status === 'raising')
        .reduce((sum: number, r: FundingRound) => sum + (Number(r.amount_raised) || 0), 0)

      // Fetch startup profile to get monthly burn rate
      const startupProfileRes = await fetch('/api/startup-profile')
      let monthlyBurn = 0
      let cashRemaining = totalRaised

      if (startupProfileRes.ok) {
        const startupProfileData = await startupProfileRes.json()
        if (startupProfileData.profile) {
          monthlyBurn = Number(startupProfileData.profile.burn_rate) || 0
          // Use total_raised from profile if available, otherwise use calculated totalRaised
          cashRemaining = Number(startupProfileData.profile.total_raised) || totalRaised
        }
      }

      // Calculate runway based on actual data
      const currentRunway = monthlyBurn > 0
        ? Math.floor((cashRemaining / monthlyBurn) * 10) / 10
        : 0

      // Update stats with smooth transitions
      setStats(prevStats => ({
        totalRaised,
        currentRunway,
        monthlyBurn,
        cashRemaining: cashRemaining || totalRaised
      }))

      // Use hardcoded documents instead of API
      setDocuments(hardcodedDocuments)
    } catch (error) {
      console.error('Error loading funding data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatMonthYear = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  const capitalizeRoundType = (roundType: string | null | undefined) => {
    if (!roundType) return ''
    // Handle common cases
    const type = roundType.toLowerCase()
    if (type === 'pre-seed') return 'Pre-Seed'
    if (type === 'seed') return 'Seed'
    if (type === 'series a') return 'Series A'
    if (type === 'series b') return 'Series B'
    if (type === 'series c') return 'Series C'
    if (type === 'bridge') return 'Bridge'
    // Capitalize first letter of each word
    return roundType
      .split(/[\s-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-')
  }

  const handleDocumentUpload = async (files: File[]) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    formData.append('category', 'essential')
    formData.append('type', 'document')

    const res = await fetch('/api/documents', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      throw new Error('Failed to upload documents')
    }

    await loadFundingData()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getInvestorTypeLabel = (investor: Investor) => {
    let label = ''

    // First check if original investor type is stored in notes (for mapped types like grant, angel_network)
    if (investor.notes) {
      const investorTypeMatch = investor.notes.match(/Investor Type:\s*(.+?)(?:\n|$)/i)
      if (investorTypeMatch) {
        label = investorTypeMatch[1].trim()
      }
    }

    // If no label from notes, derive from investor_type field
    if (!label && investor.investor_type) {
      const type = investor.investor_type.toLowerCase()
      if (type === 'vc') {
        label = 'VC'
      } else if (type === 'corporate' || type === 'strategic') {
        label = type.charAt(0).toUpperCase() + type.slice(1)
      } else if (type === 'angel') {
        label = 'Angel'
      } else {
        label = investor.investor_type.charAt(0).toUpperCase() + investor.investor_type.slice(1)
      }
    }

    if (!label) {
      label = 'Investor'
    }

    // Add equity type if available in notes
    if (investor.notes) {
      const equityTypeMatch = investor.notes.match(/Equity Type:\s*(\w+)/i)
      if (equityTypeMatch && equityTypeMatch[1] !== 'equity') {
        const equityType = equityTypeMatch[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        label += ` - ${equityType}`
      }
    }

    return label + ' - ' + investor.round_name
  }

  const getRoundInvestorCount = (roundId: string) => {
    return investors.filter(inv => inv.funding_round_id === roundId).length
  }
  
  const getRoundInvestors = (roundId: string) => {
    return investors.filter(inv => inv.funding_round_id === roundId)
  }

  const handleAddRound = async (roundData: any) => {
    const { investors: investorsList, ...roundInfo } = roundData

    // First create the funding round
    const res = await fetch('/api/funding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roundInfo)
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to add funding round')
    }

    const roundResult = await res.json()
    const roundId = roundResult.round?.id

    // Validate that we have a valid roundId before proceeding
    if (!roundId) {
      console.error('Failed to get round ID from response:', roundResult)
      throw new Error('Failed to create funding round - no ID returned')
    }

    // Then add investors if any (in parallel for speed)
    if (investorsList && investorsList.length > 0) {
      const investorPromises = investorsList.map(async (investor: any) => {
        const investorRes = await fetch('/api/investors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...investor,
            funding_round_id: roundId,
            investment_date: roundInfo.close_date || new Date().toISOString().split('T')[0]
          })
        })

        if (!investorRes.ok) {
          const error = await investorRes.json()
          console.error('Error creating investor:', error)
          throw new Error(`Failed to add investor ${investor.name}: ${error.error || 'Unknown error'}`)
        }

        return investorRes.json()
      })

      // Wait for all investors to be created
      await Promise.all(investorPromises)
    }

    // Reload data after all database operations complete
    await loadFundingData()
  }

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
            <h1 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-1 leading-tight">Investors & Funding</h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Organize your fundraising and track investor relationships
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-1.5 w-full sm:w-auto"
          >
            <span>+</span>
            <span>New Round</span>
          </button>
          </motion.div>

          {/* Summary Cards - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Total Raised */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 transition-all duration-300 group cursor-pointer"
          >
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Total Raised</div>
            <div className="text-3xl font-medium text-black dark:text-white mb-3 transition-all duration-300">
              ${(animatedTotalRaised / 1000).toFixed(1)}K
            </div>
            <div className="flex items-center gap-2">
              {investors.length > 0 ? (
                <>
                  {/* Show up to 3 most recent investors */}
                  {investors.slice(0, 3).map((investor) => (
                    <div
                      key={investor.id}
                      className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/20 flex items-center justify-center text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 text-xs font-medium border-2 border-white dark:border-zinc-950 -ml-1 first:ml-0 transition-colors"
                      title={investor.name}
                    >
                      {getInitials(investor.name)}
                    </div>
                  ))}
                  {investors.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/20 flex items-center justify-center text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 text-xs font-medium border-2 border-white dark:border-zinc-950 -ml-1 transition-colors">
                      +{investors.length - 3}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">No investors yet</span>
              )}
            </div>
          </motion.div>

          {/* Current Runway */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 transition-all duration-300 group cursor-pointer"
          >
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Current Runway</div>
            <div className="text-3xl font-medium text-black dark:text-white transition-all duration-300">
              {animatedRunway.toFixed(1)} months
            </div>
          </motion.div>

          {/* Monthly Burn */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Monthly Burn</div>
              <button
                onClick={() => {
                  setMonthlyBurnInput(stats.monthlyBurn.toString())
                  setShowBurnModal(true)
                }}
                className="text-[10px] text-zinc-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Edit
              </button>
            </div>
            <div className="text-3xl font-medium text-black dark:text-white">
              ${stats.monthlyBurn > 0 ? stats.monthlyBurn.toLocaleString() : '—'}
            </div>
            {stats.monthlyBurn === 0 && (
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Click Edit to set your monthly burn rate
              </div>
            )}
          </motion.div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-zinc-500 text-xs">Loading funding data...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Funding Rounds */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Funding Rounds
                  </h3>
                </div>
                <div className="p-4">
                  {rounds.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No funding rounds yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rounds.map((round, index) => {
                        const roundInvestors = getRoundInvestors(round.id)
                        const investorCount = roundInvestors.length
                        // Find lead investor: first check is_lead flag, then fall back to heuristics
                        const leadInvestor = roundInvestors.find(inv => inv.is_lead) ||
                                            roundInvestors.find(inv => inv.investor_type === 'vc' || inv.firm) ||
                                            roundInvestors[0]
                        
                        const roundTypeDisplay = capitalizeRoundType(round.round_type || round.round_name)
                        
                        return (
                          <motion.div
                            key={round.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            whileHover={{ scale: 1.01, y: -2 }}
                            className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* Title and Status */}
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-sm font-medium text-black dark:text-white">
                                    {roundTypeDisplay}
                                  </h4>
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.1 + 0.1, type: 'spring' }}
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                      round.status === 'closed' 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : round.status === 'raising'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                    }`}
                                  >
                                    {round.status === 'closed' ? 'Closed' : round.status === 'raising' ? 'Raising' : 'Planned'}
                                  </motion.span>
                                </div>
                                
                                {/* Lead Investor */}
                                {leadInvestor && (
                                  <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.1 + 0.15 }}
                                    className="text-xs text-zinc-600 dark:text-zinc-400 mb-2"
                                  >
                                    Lead: {leadInvestor.firm || leadInvestor.name}
                                  </motion.p>
                                )}
                                
                                {/* Investors and Date with Icons */}
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: index * 0.1 + 0.2 }}
                                  className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400"
                                >
                                  <div className="flex items-center gap-1.5 group/investors">
                                    <BarChart3 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover/investors:text-orange-600 dark:group-hover/investors:text-orange-400 transition-colors" />
                                    <span className="group-hover/investors:text-orange-600 dark:group-hover/investors:text-orange-400 transition-colors">{investorCount} investors</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 group/date">
                                    <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 group-hover/date:text-orange-600 dark:group-hover/date:text-orange-400 transition-colors" />
                                    <span className="group-hover/date:text-orange-600 dark:group-hover/date:text-orange-400 transition-colors">{formatMonthYear(round.close_date)}</span>
                                  </div>
                                </motion.div>
                              </div>
                              
                              {/* Right Side - Amount and Date */}
                              <div className="text-right ml-4">
                                <motion.div
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 + 0.1 }}
                                  className="text-sm font-semibold text-black dark:text-white mb-1"
                                >
                                  ${(round.amount_raised / 1000).toFixed(1)}K
                                </motion.div>
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: index * 0.1 + 0.15 }}
                                  className="text-[10px] text-zinc-400 dark:text-zinc-500"
                                >
                                  {formatShortDate(round.close_date)}
                                </motion.div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Investors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-black dark:text-white">
                    Investors
                  </h3>
                </div>
                <div className="p-4">
                  {investors.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No investors yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {investors.map((investor) => (
                        <motion.div
                          key={investor.id}
                          whileHover={{ x: 4 }}
                          className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors group cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/20 flex items-center justify-center text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 text-sm font-medium flex-shrink-0 transition-colors">
                            {getInitials(investor.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-black dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {investor.name}
                            </div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {getInvestorTypeLabel(investor)}
                              {(investor.equity_percent ?? 0) > 0 && ` • ${investor.equity_percent}% equity`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              ${investor.investment_amount.toLocaleString()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Runway */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.01 }}
                className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 group cursor-pointer"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Runway</h3>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Cash remaining</span>
                      <span className="text-sm font-semibold text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-all duration-300">
                        ${(animatedCashRemaining / 1000).toFixed(1)}K
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-zinc-900 dark:bg-white group-hover:bg-orange-600 dark:group-hover:bg-orange-400 h-2.5 rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${stats.totalRaised > 0 ? Math.min((animatedCashRemaining / stats.totalRaised) * 100, 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-medium text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 mb-1 transition-all duration-300">
                        {animatedRunway.toFixed(1)}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        Months runway
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-medium text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 mb-1 transition-all duration-300">
                        ${stats.monthlyBurn.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        Monthly burn
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Documents */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-black dark:text-white">Documents</h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDocumentUpload(true)}
                    className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors font-medium"
                  >
                    <span>+</span>
                    <span>Add</span>
                  </motion.button>
                </div>
                <div className="p-4">
                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No documents yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ x: 4 }}
                          className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/20 transition-colors">
                              <FileText className="w-4 h-4 text-zinc-600 dark:text-zinc-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-black dark:text-white">
                                {doc.title}
                              </div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                {formatShortDate(doc.created_at)}
                              </div>
                            </div>
                          </div>
                          <motion.a
                            href={doc.url || '#'}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </motion.a>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Add Funding Round Modal */}
      {showAddModal && (
        <AddFundingRoundModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddRound}
        />
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showDocumentUpload}
        onClose={() => setShowDocumentUpload(false)}
        onUpload={handleDocumentUpload}
        documentType="Investor Document"
        allowMultiple={true}
      />

      {/* Monthly Burn Modal */}
      {showBurnModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md p-4">
            <h3 className="text-xl font-bold text-black dark:text-white mb-4">
              Set Monthly Burn Rate
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Enter your average monthly expenses to calculate your runway.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Monthly Burn Rate ($)
              </label>
              <input
                type="number"
                value={monthlyBurnInput}
                onChange={(e) => setMonthlyBurnInput(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="0"
                min="0"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBurnModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const burnRate = Number(monthlyBurnInput) || 0

                    // First get current profile to preserve existing data
                    const currentProfileRes = await fetch('/api/startup-profile')
                    let existingProfile = {}
                    if (currentProfileRes.ok) {
                      const data = await currentProfileRes.json()
                      existingProfile = data.profile || {}
                    }

                    const res = await fetch('/api/startup-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...existingProfile,
                        burn_rate: burnRate,
                        // Ensure company_name is set (required field)
                        company_name: (existingProfile as any).company_name || 'My Startup'
                      })
                    })

                    if (!res.ok) {
                      const error = await res.json()
                      console.error('Error saving burn rate:', error)
                      alert('Failed to save burn rate. Please try again.')
                      return
                    }

                    setShowBurnModal(false)
                    await loadFundingData()
                  } catch (error) {
                    console.error('Error saving burn rate:', error)
                    alert('Failed to save burn rate. Please try again.')
                  }
                }}
                className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      </PageBackground>
    </AppLayout>
  )
}
