'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'
import IntegrationLogo from '@/components/IntegrationLogo'
import { useRouter } from 'next/navigation'

interface Integration {
  id: string
  name: string
  category: string
  logo_url: string | null
  description: string | null
  is_connected: boolean
  monthly_cost?: number | null
  users_connected?: number
  status?: 'active' | 'inactive'
}

const CATEGORIES = ['All', 'Communication', 'Product', 'Development', 'Finance', 'Marketing']

// Define all integrations based on environment variables provided
const ALL_INTEGRATIONS: Omit<Integration, 'is_connected'>[] = [
  // Communication
  { id: 'gmail', name: 'Gmail', category: 'Communication', logo_url: null, description: 'Send and manage emails, automate outreach campaigns' },
  { id: 'google-calendar', name: 'Google Calendar', category: 'Communication', logo_url: null, description: 'Schedule meetings and sync your availability' },
  { id: 'outlook', name: 'Outlook', category: 'Communication', logo_url: null, description: 'Microsoft email integration for enterprise workflows' },
  { id: 'slack', name: 'Slack', category: 'Communication', logo_url: null, description: 'Team messaging and notifications for updates' },
  { id: 'discord', name: 'Discord', category: 'Communication', logo_url: null, description: 'Community management and team coordination' },
  { id: 'zoom', name: 'Zoom', category: 'Communication', logo_url: null, description: 'Video conferencing and virtual meetings' },
  { id: 'calendly', name: 'Calendly', category: 'Communication', logo_url: null, description: 'Automated scheduling links for customer meetings' },
  { id: 'intercom', name: 'Intercom', category: 'Communication', logo_url: null, description: 'Customer messaging and support platform' },
  { id: 'zendesk', name: 'Zendesk', category: 'Communication', logo_url: null, description: 'Customer service and ticketing system' },
  
  // Product
  { id: 'notion', name: 'Notion', category: 'Product', logo_url: null, description: 'Sync tasks, documents, and knowledge base' },
  { id: 'jira', name: 'Jira', category: 'Product', logo_url: null, description: 'Agile project management for dev teams' },
  { id: 'asana', name: 'Asana', category: 'Product', logo_url: null, description: 'Task and project management platform' },
  { id: 'tally', name: 'Tally', category: 'Product', logo_url: null, description: 'Create beautiful forms and collect responses' },
  { id: 'typeform', name: 'Typeform', category: 'Product', logo_url: null, description: 'Interactive forms and surveys for user research' },
  
  // Development
  { id: 'github', name: 'GitHub', category: 'Development', logo_url: null, description: 'Code repository and collaboration platform' },
  { id: 'gitlab', name: 'GitLab', category: 'Development', logo_url: null, description: 'DevOps platform for complete CI/CD' },
  { id: 'vercel', name: 'Vercel', category: 'Development', logo_url: null, description: 'Deploy and host your web applications' },
  
  // Finance
  { id: 'stripe', name: 'Stripe', category: 'Finance', logo_url: null, description: 'Payment processing and billing automation' },
  { id: 'quickbooks', name: 'QuickBooks', category: 'Finance', logo_url: null, description: 'Financial management and bookkeeping' },
  
  // Marketing
  { id: 'linkedin', name: 'LinkedIn', category: 'Marketing', logo_url: null, description: 'Professional networking and outreach' },
  { id: 'twitter', name: 'Twitter/X', category: 'Marketing', logo_url: null, description: 'Social media engagement and content sharing' },
  { id: 'mailchimp', name: 'Mailchimp', category: 'Marketing', logo_url: null, description: 'Email marketing and campaign automation' },
  { id: 'hubspot', name: 'HubSpot', category: 'Marketing', logo_url: null, description: 'All-in-one CRM and marketing platform' },
]

export default function ToolsPage() {
  const router = useRouter()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({ connected: 0, available: 0, categories: 0 })

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setUser(profileData)

      // Fetch connected integration status
      const statusRes = await fetch('/api/integrations/status')
      const statusData = await statusRes.json()
      const integrationStatus = statusData.status || {}

      // Map integrations with connection status, user count, and pricing
      const integrationsWithStatus: Integration[] = ALL_INTEGRATIONS.map(integration => {
        const isConnected = integrationStatus[integration.id] || false
        // Mock user count for connected integrations (in real app, fetch from API)
        const usersConnected = isConnected ? Math.floor(Math.random() * 10) + 1 : 0
        // Mock pricing (in real app, fetch from integration config)
        const monthlyCost = integration.id === 'slack' ? 0 : null // Free for most, can be customized
        
        return {
          ...integration,
          is_connected: isConnected,
          status: isConnected ? 'active' : 'inactive',
          users_connected: usersConnected,
          monthly_cost: monthlyCost
        }
      })

      setIntegrations(integrationsWithStatus)

      const connectedCount = integrationsWithStatus.filter(i => i.is_connected).length
      const categoriesSet = new Set(integrationsWithStatus.map(i => i.category))

      setStats({
        connected: connectedCount,
        available: integrationsWithStatus.length - connectedCount,
        categories: categoriesSet.size
      })
    } catch (error) {
      console.error('Error loading integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = (integrationId: string) => {
    router.push(`/integrations?connect=${integrationId}`)
  }

  const handleDisconnect = async (integrationId: string) => {
    // This would call a disconnect API endpoint
    console.log('Disconnect:', integrationId)
    // Reload to refresh status
    await loadIntegrations()
  }

  const connectedIntegrations = integrations.filter(i => i.is_connected)
  const availableIntegrations = integrations.filter(i => !i.is_connected)

  const filterIntegrations = (items: Integration[]) => {
    let filtered = items

    if (searchQuery) {
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(i => i.category === selectedCategory)
    }

    return filtered
  }

  const filteredConnected = filterIntegrations(connectedIntegrations)
  const filteredAvailable = filterIntegrations(availableIntegrations)

  const renderIntegrationCard = (integration: Integration) => (
    <div
      key={integration.id}
      className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
    >
      {/* Header with Logo and Name */}
      <div className="flex items-start gap-4 mb-3">
        <IntegrationLogo name={integration.name} size="md" />
        <div className="flex-1">
          <h3 className="font-bold text-sm text-black dark:text-white mb-1">{integration.name}</h3>
          <span className="inline-block px-2.5 py-1 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white text-xs font-medium rounded-full">
            {integration.category}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        {integration.description}
      </p>

      {/* Footer with User Count and Pricing */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>{integration.users_connected || 0} users</span>
        </div>
        <div className="text-sm font-medium text-black dark:text-white">
          {integration.monthly_cost ? `$${integration.monthly_cost}/mo` : 'Free/mo'}
        </div>
      </div>
    </div>
  )

  return (
    <AppLayout user={user}>
      <PageBackground>
        <div className="p-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
          <h1 className="text-xl font-semibold text-black dark:text-white leading-tight">
            Tools
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Connect the tools your team uses to build and grow
          </p>
          </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Connected</span>
            </div>
            <div className="text-2xl font-semibold text-black dark:text-white">
              {stats.connected}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Available</span>
            </div>
            <div className="text-2xl font-semibold text-black dark:text-white">
              {stats.available}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Categories</span>
            </div>
            <div className="text-2xl font-semibold text-black dark:text-white">
              {stats.categories}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-black dark:text-white"
            />
            <svg className="w-5 h-5 text-zinc-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading integrations...</div>
        ) : (
          <div className="space-y-8">
            {/* Connected Integrations */}
            {filteredConnected.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-black dark:text-white mb-3">
                  Connected Integrations
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {filteredConnected.map(renderIntegrationCard)}
                </div>
              </div>
            )}

            {/* Available Integrations by Category */}
            {CATEGORIES.filter(cat => cat !== 'All').map(category => {
              const categoryIntegrations = filteredAvailable.filter(i => i.category === category)
              if (categoryIntegrations.length === 0) return null

              return (
                <div key={category}>
                  <h2 className="text-sm font-semibold text-black dark:text-white mb-3">
                    {category}
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    {categoryIntegrations.map(renderIntegrationCard)}
                  </div>
                </div>
              )
            })}

            {/* Empty State */}
            {filteredConnected.length === 0 && filteredAvailable.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {searchQuery ? 'No integrations found' : 'No integrations available'}
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      </PageBackground>
    </AppLayout>
  )
}
