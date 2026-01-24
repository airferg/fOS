'use client'

import { useState, useEffect } from 'react'

interface TeamMember {
  id: string
  name: string
  role: string
  title: string
  equity_percent: number
  avatar_url: string | null
}

interface Investor {
  id: string
  name: string
  investment_amount: number
  round_name: string
  investor_type?: string
}

interface FundingRound {
  id: string
  round_name: string
  amount_raised: number
  status: string
}

interface GeneratedPortfolioModalProps {
  onClose: () => void
  onExportPDF: () => void
}

export default function GeneratedPortfolioModal({ onClose, onExportPDF }: GeneratedPortfolioModalProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [investors, setInvestors] = useState<Investor[]>([])
  const [fundingRounds, setFundingRounds] = useState<FundingRound[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalRaised: 0,
    runway: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPortfolioData()
  }, [])

  const loadPortfolioData = async () => {
    try {
      const [profileRes, teamRes, fundingRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/team'),
        fetch('/api/funding'),
      ])

      const profileData = await profileRes.json()
      const teamData = await teamRes.json()
      const fundingData = await fundingRes.json()

      setProfile(profileData)
      setTeamMembers(teamData.teamMembers || [])
      setInvestors(fundingData.investors || [])
      setFundingRounds(fundingData.rounds || [])

      const totalRaised = (fundingData.rounds || [])
        .filter((r: any) => r.status === 'closed')
        .reduce((sum: number, r: any) => sum + (Number(r.amount_raised) || 0), 0)

      setStats({
        totalRaised: totalRaised || 6500,
        runway: 9, // Calculate from user profile
      })
    } catch (error) {
      console.error('Error loading portfolio data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const founderEquity = teamMembers
    .filter(m => m.role === 'Founder')
    .reduce((sum, m) => sum + (m.equity_percent || 0), 0)

  const investorEquity = 12 // This would be calculated from funding data
  const employeePool = 15
  const reserved = 100 - founderEquity - investorEquity - employeePool

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl p-8">
          <div className="animate-spin w-6 h-6 border-2 border-zinc-300 border-t-black dark:border-zinc-600 dark:border-t-white rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-8 py-4 flex items-center justify-between z-10">
          <h1 className="text-xl font-semibold text-black dark:text-white">
            Startup Portfolio - {profile?.company_name || 'Hydra'}
          </h1>
          <button
            onClick={onExportPDF}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Company Overview */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
              {profile?.company_name?.charAt(0) || 'F'}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-black dark:text-white mb-2">
                {profile?.company_name || 'Hydra'}
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-3">
                {profile?.tagline || 'The operating system for founders.'}
              </p>
              <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Founded {formatDate(profile?.founded_date || '2025-01-01')}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {profile?.location || 'Charlottesville, VA'}
                </span>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Executive Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Current Stage</div>
                <div className="text-lg font-semibold text-black dark:text-white">
                  {profile?.stage || 'Pre-Seed'}
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Total Raised</div>
                <div className="text-lg font-semibold text-black dark:text-white">
                  ${(stats.totalRaised / 1000).toFixed(1)}K
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Runway</div>
                <div className="text-lg font-semibold text-black dark:text-white">
                  {stats.runway} months
                </div>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Team ({teamMembers.length} members)
            </h3>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-4">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {getInitials(member.name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-black dark:text-white">{member.name}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">{member.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-black dark:text-white">{member.equity_percent}%</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">equity</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Funding Section */}
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Funding</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Total Raised</div>
                <div className="text-2xl font-bold text-black dark:text-white">
                  ${(stats.totalRaised / 1000).toFixed(1)}K
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Monthly Burn</div>
                <div className="text-2xl font-bold text-black dark:text-white">$692</div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-black dark:text-white mb-2">Investors</h4>
              <div className="space-y-2">
                {investors.slice(0, 5).map((investor) => (
                  <div key={investor.id} className="flex items-center justify-between py-2 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                        {getInitials(investor.name)}
                      </div>
                      <div>
                        <div className="font-medium text-black dark:text-white">{investor.name}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {investor.investor_type || 'Angel'} - {investor.round_name}
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold text-black dark:text-white">
                      ${(investor.investment_amount / 1000).toFixed(1)}K
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Equity Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Equity Breakdown</h3>
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className="bg-zinc-900 dark:bg-zinc-300 flex items-center justify-center text-white dark:text-black text-xs font-medium"
                style={{ width: `${founderEquity}%` }}
              >
                {founderEquity > 5 && `${founderEquity}%`}
              </div>
              <div
                className="bg-zinc-700 dark:bg-zinc-500 flex items-center justify-center text-white dark:text-black text-xs font-medium"
                style={{ width: `${employeePool}%` }}
              >
                {employeePool > 5 && `${employeePool}%`}
              </div>
              <div
                className="bg-zinc-500 dark:bg-zinc-700 flex items-center justify-center text-white dark:text-black text-xs font-medium"
                style={{ width: `${investorEquity}%` }}
              >
                {investorEquity > 5 && `${investorEquity}%`}
              </div>
              <div
                className="bg-zinc-300 dark:bg-zinc-900 flex items-center justify-center text-black dark:text-white text-xs font-medium"
                style={{ width: `${reserved}%` }}
              >
                {reserved > 5 && `${reserved}%`}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-zinc-900 dark:bg-zinc-300"></div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Founders {founderEquity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-zinc-700 dark:bg-zinc-500"></div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Employee Pool {employeePool}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-zinc-500 dark:bg-zinc-700"></div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Investors {investorEquity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-zinc-300 dark:bg-zinc-900"></div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Reserved {reserved}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-8 py-4 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Generated by Hydra on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Close Button */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 px-8 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

