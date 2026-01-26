'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'
import ActivityFeed from '@/components/ActivityFeed'
import SlackMessagePopup from '@/components/SlackMessagePopup'
import SlackNotificationPopup from '@/components/SlackNotificationPopup'
import IntegrationLogo from '@/components/IntegrationLogo'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  connectedIntegrations: string[]
  totalRaised: number
  fundingStage: string
  marketingReach: number
  engagementRate: number
  weeklyGrowth: number
}

interface DashboardCard {
  id: string
  type: 'activity' | 'gtm' | 'team' | 'tools' | 'funding' | 'network' | 'product' | 'compliance'
  title: string
  component: React.ReactNode
}

// Sortable Card Component
function SortableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative transition-all ${
        isDragging ? 'shadow-[0_0_0_3px_rgba(234,179,8,0.5)] ring-2 ring-yellow-500/50 opacity-80 scale-[1.02]' : ''
      }`}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute top-2 right-2 z-10 p-1.5 rounded cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-opacity"
        title="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      {children}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    networkConnections: 0,
    networkTrend: 0,
    teamMembers: [],
    teamCount: 0,
    activeTools: 0,
    connectedIntegrations: [],
    totalRaised: 0,
    fundingStage: '',
    marketingReach: 0,
    engagementRate: 0,
    weeklyGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [columnLayout, setColumnLayout] = useState<2 | 3 | 4>(2)

  const [cards, setCards] = useState<string[]>([
    'network',
    'team',
    'tools',
    'funding',
    'activity',
    'gtm',
    'product',
    'compliance'
  ])
  const [showLayoutDrawer, setShowLayoutDrawer] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadDashboardData()
    // Load saved layout preferences
    const savedLayout = localStorage.getItem('dashboardLayout')
    if (savedLayout) {
      setColumnLayout(parseInt(savedLayout) as 2 | 3 | 4)
    }
    const savedOrder = localStorage.getItem('dashboardCardOrder')
    if (savedOrder) {
      const parsed = JSON.parse(savedOrder) as string[]
      // Define all available cards (use 'funding' not 'kpi-funding' to avoid duplicates)
      const allCards = ['network', 'team', 'tools', 'funding', 'activity', 'gtm', 'product', 'compliance']
      // Remove deprecated cards: 'marketing' (renamed to 'gtm'), 'kpi-funding' (use 'funding')
      const filtered = parsed.filter(c => c !== 'marketing' && c !== 'kpi-funding')
      // Add any new cards that aren't in saved order
      const missingCards = allCards.filter(c => !filtered.includes(c))
      const newOrder = [...filtered, ...missingCards]
      // Save the cleaned up order
      localStorage.setItem('dashboardCardOrder', JSON.stringify(newOrder))
      setCards(newOrder)
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setUser(profileData)

      const [contactsRes, teamRes, integrationsRes, fundingRes, marketingRes] = await Promise.all([
        fetch('/api/contacts').catch(() => ({ json: () => ({ contacts: [] }) })),
        fetch('/api/team').catch(() => ({ json: () => ({ teamMembers: [] }) })),
        fetch('/api/integrations/status').catch(() => ({ json: () => ({ status: {} }) })),
        fetch('/api/funding').catch(() => ({ json: () => ({ stats: { totalRaised: 6500 } }) })),
        fetch('/api/marketing').catch(() => ({ json: () => ({ stats: {} }) }))
      ])

      const contactsData = await contactsRes.json()
      const teamData = await teamRes.json()
      const integrationsData = await integrationsRes.json()
      const fundingData = await fundingRes.json()
      const marketingData = await marketingRes.json()

      // Get connected integrations - only count integrations that are in the tools list
      const integrationStatus = integrationsData.status || {}
      // Define the same list of integrations as the tools page uses (from ALL_INTEGRATIONS)
      const validIntegrationIds = [
        'gmail', 'google-calendar', 'outlook', 'slack', 'discord', 'zoom', 'calendly',
        'intercom', 'zendesk', 'notion', 'jira', 'asana', 'tally', 'typeform',
        'github', 'gitlab', 'vercel', 'stripe', 'quickbooks',
        'linkedin', 'twitter', 'mailchimp', 'hubspot'
      ]
      const connectedIntegrations = validIntegrationIds.filter(
        id => integrationStatus[id] === true
      ) || []

      // Calculate network trend based on recent activity
      const contacts = contactsData.contacts || []
      const recentContacts = contacts.filter((c: any) => {
        const createdDate = new Date(c.created_at)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return createdDate >= thirtyDaysAgo
      })
      const networkTrend = contacts.length > 0
        ? Math.round((recentContacts.length / contacts.length) * 100)
        : 0

      // Get the most recent funding round name
      const rounds = fundingData.rounds || []
      const latestRound = rounds[0]
      const fundingStage = latestRound?.round_name || (fundingData.stats?.totalRaised > 0 ? 'Funded' : 'Not yet funded')

      setStats({
        networkConnections: contacts.length,
        networkTrend,
        teamMembers: teamData.teamMembers?.slice(0, 8) || [],
        teamCount: teamData.teamMembers?.length || 0,
        activeTools: connectedIntegrations.length,
        connectedIntegrations: connectedIntegrations || [],
        totalRaised: fundingData.stats?.totalRaised || 0,
        fundingStage,
        marketingReach: marketingData.stats?.totalReach || 0,
        engagementRate: marketingData.stats?.avgEngagement || 0,
        weeklyGrowth: marketingData.stats?.weeklyGrowth || 0
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setCards((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        const newOrder = arrayMove(items, oldIndex, newIndex)

        // Save to localStorage
        localStorage.setItem('dashboardCardOrder', JSON.stringify(newOrder))

        return newOrder
      })
    }
  }

  const handleLayoutChange = (layout: 2 | 3 | 4) => {
    setColumnLayout(layout)
    localStorage.setItem('dashboardLayout', layout.toString())
  }

  const cardComponents: Record<string, React.ReactNode> = {
    'kpi-network': (
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Network Connections</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/contacts')
            }}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            View all
          </button>
        </div>
        <div className="text-2xl font-semibold text-black dark:text-white mb-1">
          {stats.networkConnections}
        </div>
        {stats.networkTrend > 0 ? (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-green-600 dark:text-green-400">↑ {stats.networkTrend}%</span>
            <span className="text-zinc-500 dark:text-zinc-400">this month</span>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            No recent growth
          </div>
        )}
      </div>
    ),
    'kpi-team': (
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Team Members</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/team')
            }}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            View all
          </button>
        </div>
        <div className="text-2xl font-semibold text-black dark:text-white mb-1">
          {stats.teamCount}
        </div>
        {stats.teamMembers.length > 0 ? (
          <div className="flex items-center mt-2">
            <div className="flex -space-x-2">
              {stats.teamMembers.map((member) => (
                member.avatar_url ? (
                  <img
                    key={member.id}
                    src={member.avatar_url}
                    alt={member.name}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 object-cover"
                  />
                ) : (
                  <div
                    key={member.id}
                    className="w-8 h-8 rounded-full bg-zinc-800 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-white text-xs font-medium"
                  >
                    {member.name.charAt(0)}
                  </div>
                )
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            No team members yet
          </div>
        )}
      </div>
    ),
    'kpi-tools': (
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Active Tools</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/tools')
            }}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            View all
          </button>
        </div>
        <div className="text-2xl font-semibold text-black dark:text-white mb-1">
          {stats.activeTools}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          {stats.activeTools === 0 ? 'No tools connected' : 'Connected integrations'}
        </div>
        {stats.connectedIntegrations && stats.connectedIntegrations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {stats.connectedIntegrations.slice(0, 6).map((integrationId) => {
              // Map integration IDs to display names
              const nameMap: Record<string, string> = {
                'gmail': 'Gmail',
                'google-calendar': 'Google Calendar',
                'google-docs': 'Google Docs',
                'outlook': 'Outlook',
                'slack': 'Slack',
                'discord': 'Discord',
                'zoom': 'Zoom',
                'calendly': 'Calendly',
                'notion': 'Notion',
                'jira': 'Jira',
                'github': 'GitHub',
                'stripe': 'Stripe',
                'intercom': 'Intercom',
                'zendesk': 'Zendesk',
                'asana': 'Asana',
                'tally': 'Tally',
                'typeform': 'Typeform',
                'gitlab': 'GitLab',
                'vercel': 'Vercel',
                'quickbooks': 'QuickBooks',
                'linkedin': 'LinkedIn',
                'twitter': 'Twitter',
                'mailchimp': 'Mailchimp',
                'hubspot': 'HubSpot',
              }
              const displayName = nameMap[integrationId] || integrationId
              return (
                <IntegrationLogo key={integrationId} name={displayName} size="sm" />
              )
            })}
            {stats.connectedIntegrations && stats.connectedIntegrations.length > 6 && (
              <div className="flex items-center justify-center w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                +{stats.connectedIntegrations.length - 6}
              </div>
            )}
          </div>
        )}
      </div>
    ),
    activity: (
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5 h-full">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Recent Activity
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/workspace')
            }}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            View all
          </button>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          <ActivityFeed limit={10} />
        </div>
      </div>
    ),
    gtm: (
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5 h-full">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            GTM Overview
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/marketing')
            }}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            View details
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Pipeline Deals</span>
              <span className="text-base font-semibold text-black dark:text-white">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Active Sequences</span>
              <span className="text-base font-semibold text-black dark:text-white">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Activation Rate</span>
              <span className="text-base font-semibold text-black dark:text-white">68%</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1.5">
              Pipeline Stage Distribution
            </div>
            <div className="flex gap-1 h-3 rounded overflow-hidden">
              <div className="bg-zinc-300 dark:bg-zinc-700" style={{ width: '25%' }} title="Lead" />
              <div className="bg-zinc-500" style={{ width: '35%' }} title="Qualified" />
              <div className="bg-zinc-700 dark:bg-zinc-400" style={{ width: '25%' }} title="Proposal" />
              <div className="bg-black dark:bg-white" style={{ width: '15%' }} title="Closed" />
            </div>
          </div>
        </div>
      </div>
    ),
    product: (
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5 h-full">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Product
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/research')
            }}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            View details
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Feedback Items</span>
              <span className="text-base font-semibold text-black dark:text-white">24</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Active Tests</span>
              <span className="text-base font-semibold text-black dark:text-white">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Interviews Scheduled</span>
              <span className="text-base font-semibold text-black dark:text-white">3</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1.5">
              NPS Score
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '72%' }} />
              </div>
              <span className="text-xs font-semibold text-black dark:text-white">42</span>
            </div>
          </div>
        </div>
      </div>
    ),
    compliance: (
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5 h-full">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Compliance
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/legal')
            }}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            View details
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Entity Status</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Virginia LLC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Filings Due</span>
              <span className="text-base font-semibold text-black dark:text-white">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Documents</span>
              <span className="text-base font-semibold text-black dark:text-white">8</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1.5">
              Compliance Health
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: '85%' }} />
              </div>
              <span className="text-xs font-semibold text-black dark:text-white">85%</span>
            </div>
          </div>
        </div>
      </div>
    ),
    network: (
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5 h-full">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Network Connections
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/contacts')
            }}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            View all
          </button>
        </div>
        <div className="p-4">
          <div className="text-3xl font-bold text-black dark:text-white mb-1.5">
            {stats.networkConnections}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            Total connections
          </div>
          {stats.networkTrend > 0 ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-600 dark:text-green-400 font-medium">
                ↑ {stats.networkTrend}%
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">this month</span>
            </div>
          ) : stats.networkConnections === 0 ? (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Start adding contacts to build your network
            </div>
          ) : (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              No recent growth
            </div>
          )}
        </div>
      </div>
    ),
    team: (
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5 h-full">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Team Members
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/team')
            }}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            View all
          </button>
        </div>
        <div className="p-4">
          <div className="text-3xl font-bold text-black dark:text-white mb-1.5">
            {stats.teamCount}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            {stats.teamCount === 0 ? 'No team members yet' : 'Total team members'}
          </div>
          {stats.teamMembers.length > 0 && (
            <div className="flex -space-x-2">
              {stats.teamMembers.slice(0, 8).map((member) => (
                member.avatar_url ? (
                  <img
                    key={member.id}
                    src={member.avatar_url}
                    alt={member.name}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 object-cover"
                  />
                ) : (
                  <div
                    key={member.id}
                    className="w-8 h-8 rounded-full bg-zinc-800 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-white text-xs font-medium"
                  >
                    {member.name.charAt(0)}
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    tools: (
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5 h-full">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Active Tools
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/tools')
            }}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            View all
          </button>
        </div>
        <div className="p-4">
          <div className="text-3xl font-bold text-black dark:text-white mb-1.5">
            {stats.activeTools}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            All on free tier
          </div>
        </div>
      </div>
    ),
    funding: (
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5 h-full">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Total Raised
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/funding')
            }}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
          >
            View details
          </button>
        </div>
        <div className="p-4">
          <div className="text-3xl font-bold text-black dark:text-white mb-1.5">
            ${(stats.totalRaised / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            {stats.fundingStage}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xs font-semibold text-zinc-600 dark:text-zinc-400">
              DI
            </div>
            <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xs font-semibold text-zinc-600 dark:text-zinc-400">
              CA
            </div>
          </div>
        </div>
      </div>
    ),
  }

  const userName = user?.name?.split(' ')[0] || 'Kean'

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[columnLayout]

  return (
    <AppLayout user={user}>
      <PageBackground>
        <div className="p-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-start justify-between"
          >
          <div>
            <h1 className="text-xl font-semibold text-black dark:text-white leading-tight">
              Good morning, {userName}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Here's what's happening with your startup today.
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Drag cards to rearrange your dashboard
            </p>
          </div>
          <div className="flex items-center gap-3 relative">
            {/* Layout Toggle Button */}
            <button
              onClick={() => setShowLayoutDrawer(!showLayoutDrawer)}
              className="p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
              title="Dashboard Layout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Drawer Menu */}
            {showLayoutDrawer && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLayoutDrawer(false)}
                />
                {/* Drawer */}
                <div className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-3 min-w-[180px]">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Dashboard Layout
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        handleLayoutChange(4)
                        setShowLayoutDrawer(false)
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                        columnLayout === 4
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="2" y="2" width="4" height="20" />
                        <rect x="8" y="2" width="4" height="20" />
                        <rect x="14" y="2" width="4" height="20" />
                        <rect x="20" y="2" width="2" height="20" />
                      </svg>
                      <span>4 Columns</span>
                      {columnLayout === 4 && <span className="ml-auto text-xs">Active</span>}
                    </button>
                    <button
                      onClick={() => {
                        handleLayoutChange(3)
                        setShowLayoutDrawer(false)
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                        columnLayout === 3
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="2" y="2" width="5" height="20" />
                        <rect x="9" y="2" width="6" height="20" />
                        <rect x="17" y="2" width="5" height="20" />
                      </svg>
                      <span>3 Columns</span>
                      {columnLayout === 3 && <span className="ml-auto text-xs">Active</span>}
                    </button>
                    <button
                      onClick={() => {
                        handleLayoutChange(2)
                        setShowLayoutDrawer(false)
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                        columnLayout === 2
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="2" y="2" width="9" height="20" />
                        <rect x="13" y="2" width="9" height="20" />
                      </svg>
                      <span>2 Columns</span>
                      {columnLayout === 2 && <span className="ml-auto text-xs">Active</span>}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          </motion.div>

          {/* Slack Notification Popup */}
          <SlackNotificationPopup />

          {/* All Draggable Cards (including KPIs) */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={cards} strategy={rectSortingStrategy}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`grid ${gridColsClass} gap-4`}
              >
                {cards.map((cardId, index) => (
                  <motion.div
                    key={cardId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <SortableCard id={cardId}>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                      >
                        {cardComponents[cardId]}
                      </motion.div>
                    </SortableCard>
                  </motion.div>
                ))}
              </motion.div>
            </SortableContext>
          </DndContext>
        </div>
      </PageBackground>
    </AppLayout>
  )
}
