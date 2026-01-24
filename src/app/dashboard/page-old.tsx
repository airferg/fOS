'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import ActivityFeed from '@/components/ActivityFeed'

interface TeamMember {
  id: string
  name: string
  avatar_url: string | null
}

interface DashboardStats {
  networkConnections: number
  networkTrend: number
  teamMembers: TeamMember[]
  teamCount: number
  activeTools: number
  totalRaised: number
  fundingStage: string
  marketingReach: number
  engagementRate: number
  weeklyGrowth: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    networkConnections: 247,
    networkTrend: 12,
    teamMembers: [],
    teamCount: 8,
    activeTools: 7,
    totalRaised: 6500,
    fundingStage: 'Pre-Seed Round',
    marketingReach: 11900,
    engagementRate: 4.2,
    weeklyGrowth: 8.3
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load user profile
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setUser(profileData)

      // Load all dashboard data in parallel
      const [contactsRes, teamRes, toolsRes, fundingRes, marketingRes] = await Promise.all([
        fetch('/api/contacts').catch(() => ({ json: () => ({ contacts: [] }) })),
        fetch('/api/team').catch(() => ({ json: () => ({ teamMembers: [] }) })),
        fetch('/api/tools').catch(() => ({ json: () => ({ stats: { total: 7 } }) })),
        fetch('/api/funding').catch(() => ({ json: () => ({ stats: { totalRaised: 6500 } }) })),
        fetch('/api/marketing').catch(() => ({ json: () => ({ stats: {} }) }))
      ])

      const contactsData = await contactsRes.json()
      const teamData = await teamRes.json()
      const toolsData = await toolsRes.json()
      const fundingData = await fundingRes.json()
      const marketingData = await marketingRes.json()

      // Calculate stats
      setStats({
        networkConnections: contactsData.contacts?.length || 247,
        networkTrend: 12,
        teamMembers: teamData.teamMembers?.slice(0, 8) || [],
        teamCount: teamData.teamMembers?.length || 8,
        activeTools: toolsData.stats?.total || 7,
        totalRaised: fundingData.stats?.totalRaised || 6500,
        fundingStage: fundingData.stats?.activeRound?.round_name || 'Pre-Seed Round',
        marketingReach: marketingData.stats?.totalReach || 11900,
        engagementRate: marketingData.stats?.avgEngagement || 4.2,
        weeklyGrowth: 8.3
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const userName = user?.name?.split(' ')[0] || 'Kean'

  return (
    <AppLayout user={user}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              Good morning, {userName}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Here's what's happening with your startup today.
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Drag cards to rearrange your dashboard
            </p>
          </div>
          <button
            onClick={() => router.push('/portfolio')}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-2"
          >
            <span>📊</span>
            <span>View Portfolio</span>
          </button>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Network Connections */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Network Connections</span>
              <span className="text-xl">🌐</span>
            </div>
            <div className="text-3xl font-semibold text-black dark:text-white mb-1">
              {stats.networkConnections}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-green-600 dark:text-green-400">↑ {stats.networkTrend}%</span>
              <span className="text-zinc-500 dark:text-zinc-400">this month</span>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Team Members</span>
              <span className="text-xl">👥</span>
            </div>
            <div className="text-3xl font-semibold text-black dark:text-white mb-1">
              {stats.teamCount}
            </div>
            <div className="flex items-center mt-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white dark:border-zinc-950"
                  />
                ))}
              </div>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              2 founders, 6 team members
            </div>
          </div>

          {/* Active Tools */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Active Tools</span>
              <span className="text-xl">🔧</span>
            </div>
            <div className="text-3xl font-semibold text-black dark:text-white mb-1">
              {stats.activeTools}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              All on free tier
            </div>
          </div>

          {/* Total Raised */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Raised</span>
              <span className="text-xl">💰</span>
            </div>
            <div className="text-3xl font-semibold text-black dark:text-white mb-1">
              ${(stats.totalRaised / 1000).toFixed(1)}K
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {stats.fundingStage}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-semibold text-black dark:text-white">
                Recent Activity
              </h3>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <ActivityFeed limit={10} />
            </div>
          </div>

          {/* Marketing Overview */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-black dark:text-white">
                Marketing Overview
              </h3>
              <button
                onClick={() => router.push('/marketing')}
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              >
                View details
              </button>
            </div>
            <div className="p-6">
              {/* Marketing Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Reach</span>
                  <span className="text-lg font-semibold text-black dark:text-white">
                    {(stats.marketingReach / 1000).toFixed(1)}K
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Engagement Rate</span>
                  <span className="text-lg font-semibold text-black dark:text-white">
                    {stats.engagementRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Weekly Growth</span>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    +{stats.weeklyGrowth}%
                  </span>
                </div>
              </div>

              {/* Platform Performance */}
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                  Platform Performance - Last 7 days
                </div>
                <div className="flex gap-1 h-3 rounded overflow-hidden">
                  <div className="bg-blue-400" style={{ width: '35%' }} title="Twitter" />
                  <div className="bg-red-400" style={{ width: '25%' }} title="YT" />
                  <div className="bg-purple-400" style={{ width: '20%' }} title="IG" />
                  <div className="bg-blue-500" style={{ width: '20%' }} title="FB" />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Twitter</span>
                  <span>YT</span>
                  <span>IG</span>
                  <span>FB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
