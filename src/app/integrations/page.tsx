'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { useRouter, useSearchParams } from 'next/navigation'

interface Integration {
  id: string
  name: string
  category: string
  description: string
  icon: string
  connected: boolean
  comingSoon?: boolean
}

// Integration categories for better organization
const integrationCategories = {
  'Communication & Team': [
    { id: 'gmail', name: 'Gmail', description: 'Send and manage emails, automate outreach campaigns', icon: '', sectionCategory: 'Email' },
    { id: 'outlook', name: 'Outlook', description: 'Microsoft email integration for enterprise workflows', icon: '', sectionCategory: 'Email' },
    { id: 'slack', name: 'Slack', description: 'Team messaging and notifications for updates', icon: '', sectionCategory: 'Communication' },
    { id: 'discord', name: 'Discord', description: 'Community management and team coordination', icon: '', sectionCategory: 'Communication' },
    { id: 'google-calendar', name: 'Google Calendar', description: 'Schedule meetings and sync your availability', icon: '', sectionCategory: 'Calendar' },
    { id: 'calendly', name: 'Calendly', description: 'Automated scheduling links for customer meetings', icon: '', sectionCategory: 'Scheduling' },
    { id: 'zoom', name: 'Zoom', description: 'Video conferencing and virtual meetings', icon: '', sectionCategory: 'Video' },
    { id: 'intercom', name: 'Intercom', description: 'Customer messaging and support platform', icon: '', sectionCategory: 'Support' },
    { id: 'zendesk', name: 'Zendesk', description: 'Customer service and ticketing system', icon: '', sectionCategory: 'Support' },
  ],
  'Product & Docs': [
    { id: 'notion', name: 'Notion', description: 'Sync tasks, documents, and knowledge base', icon: '', sectionCategory: 'Productivity' },
    { id: 'google-docs', name: 'Google Docs', description: 'Create and share documents automatically', icon: '', sectionCategory: 'Documents' },
    { id: 'coda', name: 'Coda', description: 'All-in-one doc for teams and workflows', icon: '', sectionCategory: 'Productivity' },
    { id: 'productboard', name: 'ProductBoard', description: 'Product roadmaps and feature prioritization', icon: '', sectionCategory: 'Product' },
    { id: 'linear', name: 'Linear', description: 'Issue tracking and project management', icon: '', sectionCategory: 'Project Management' },
    { id: 'jira', name: 'Jira', description: 'Agile project management for dev teams', icon: '', sectionCategory: 'Project Management' },
    { id: 'asana', name: 'Asana', description: 'Task and project management platform', icon: '', sectionCategory: 'Project Management' },
    { id: 'airtable', name: 'Airtable', description: 'Flexible database for tracking everything', icon: '', sectionCategory: 'Database' },
  ],
  'Development': [
    { id: 'github', name: 'GitHub', description: 'Code repository and collaboration platform', icon: '', sectionCategory: 'Development' },
    { id: 'gitlab', name: 'GitLab', description: 'DevOps platform for complete CI/CD', icon: '', sectionCategory: 'Development' },
    { id: 'vercel', name: 'Vercel', description: 'Deploy and host your web applications', icon: '', sectionCategory: 'Deployment' },
  ],
  'Forms & Surveys': [
    { id: 'tally', name: 'Tally', description: 'Create beautiful forms and collect responses', icon: '', sectionCategory: 'Forms' },
    { id: 'typeform', name: 'Typeform', description: 'Interactive forms and surveys for user research', icon: '', sectionCategory: 'Forms' },
    { id: 'google-forms', name: 'Google Forms', description: 'Simple surveys and data collection', icon: '', sectionCategory: 'Forms' },
  ],
  'Marketing & Analytics': [
    { id: 'linkedin', name: 'LinkedIn', description: 'Professional networking and outreach', icon: '', sectionCategory: 'Networking' },
    { id: 'twitter', name: 'Twitter/X', description: 'Social media engagement and content sharing', icon: '', sectionCategory: 'Social' },
    { id: 'google-analytics', name: 'Google Analytics', description: 'Website traffic and user behavior insights', icon: '', sectionCategory: 'Analytics' },
    { id: 'mixpanel', name: 'Mixpanel', description: 'Product analytics and user tracking', icon: '', sectionCategory: 'Analytics' },
    { id: 'amplitude', name: 'Amplitude', description: 'Behavioral analytics for product teams', icon: '', sectionCategory: 'Analytics' },
    { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing and campaign automation', icon: '', sectionCategory: 'Marketing' },
    { id: 'hubspot', name: 'HubSpot', description: 'All-in-one CRM and marketing platform', icon: '', sectionCategory: 'CRM' },
  ],
  'Finance & Payments': [
    { id: 'stripe', name: 'Stripe', description: 'Payment processing and billing automation', icon: '', sectionCategory: 'Payments' },
    { id: 'quickbooks', name: 'QuickBooks', description: 'Financial management and bookkeeping', icon: '', sectionCategory: 'Accounting' },
  ],
}

// Flatten integrations array for compatibility with existing code
const integrations: Integration[] = Object.values(integrationCategories).flat().map(integration => ({
  ...integration,
  category: integration.sectionCategory,
  connected: false,
}))

function IntegrationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // Categories based on main sections
  const mainCategories = ['all', ...Object.keys(integrationCategories)]

  // Load integration status from database
  useEffect(() => {
    loadIntegrationStatus()
    
    // Check for success/error messages in URL
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) {
      alert(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`)
      router.replace('/integrations')
    }
    if (error) {
      alert(`Connection failed: ${error}`)
      router.replace('/integrations')
    }
  }, [searchParams, router])

  const loadIntegrationStatus = async () => {
    try {
      const res = await fetch('/api/integrations/status', { credentials: 'include' })
      const data = await res.json()
      if (data.status) {
        setIntegrationStatus(data.status)
      }
    } catch (error) {
      console.error('Error loading integration status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get integrations by category
  const getIntegrationsByCategory = (category: string) => {
    if (category === 'all') {
      return Object.values(integrationCategories).flat()
    }
    return integrationCategories[category as keyof typeof integrationCategories] || []
  }

  const filteredIntegrations = getIntegrationsByCategory(selectedCategory)
    .map(integration => {
      const fullIntegration = integrations.find(i => i.id === integration.id)
      return {
        ...integration,
        category: integration.sectionCategory,
        connected: integrationStatus[integration.id] || false,
      }
    })
    .filter(integration => {
      const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           integration.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })

  const handleConnect = async (id: string) => {
    try {
      setLoading(true)
      
      // Map integration IDs to providers
      const providerMap: Record<string, string> = {
        'gmail': 'google',
        'google-calendar': 'google',
        'google-docs': 'google',
        'outlook': 'outlook',
        'slack': 'slack',
        'discord': 'discord',
        'zoom': 'zoom',
        'calendly': 'calendly',
        'notion': 'notion',
        'airtable': 'airtable',
        'coda': 'coda',
        'tally': 'tally',
        'typeform': 'typeform',
        'google-forms': 'google-forms',
        'productboard': 'productboard',
        'linear': 'linear',
        'jira': 'jira',
        'asana': 'asana',
        'github': 'github',
        'gitlab': 'gitlab',
        'vercel': 'vercel',
        'linkedin': 'linkedin',
        'twitter': 'twitter',
        'google-analytics': 'google-analytics',
        'stripe': 'stripe',
        'quickbooks': 'quickbooks',
        'intercom': 'intercom',
        'zendesk': 'zendesk',
        'mailchimp': 'mailchimp',
        'hubspot': 'hubspot',
        'mixpanel': 'mixpanel',
        'amplitude': 'amplitude',
      }

      const provider = providerMap[id]

      if (provider === 'google') {
        // Initiate Google OAuth flow
        const res = await fetch('/api/integrations/google/connect', { credentials: 'include' })
        const data = await res.json()
        
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error(data.error || 'Failed to initiate OAuth')
        }
      } else if (provider === 'outlook' || provider === 'slack' || provider === 'discord' || provider === 'zoom' || provider === 'calendly' || provider === 'notion' || provider === 'typeform' || provider === 'google-forms' || provider === 'jira' || provider === 'asana' || provider === 'github' || provider === 'gitlab' || provider === 'vercel' || provider === 'linkedin' || provider === 'twitter' || provider === 'google-analytics' || provider === 'stripe' || provider === 'quickbooks' || provider === 'intercom' || provider === 'zendesk' || provider === 'mailchimp' || provider === 'hubspot') {
        // Initiate OAuth flow for OAuth-based providers
        const res = await fetch(`/api/integrations/${provider}/auth`, { credentials: 'include' })
        const data = await res.json()
        
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error(data.error || 'Failed to initiate OAuth')
        }
      } else if (provider === 'airtable' || provider === 'coda' || provider === 'tally' || provider === 'productboard' || provider === 'linear' || provider === 'mixpanel' || provider === 'amplitude') {
        // PAT/API key based providers - prompt for token
        let token: string | null = null
        let secret: string | null = null
        let projectId: string | null = null

        if (provider === 'amplitude') {
          token = prompt(`Enter your ${integrations.find(i => i.id === id)?.name} API key:`)
          if (!token || !token.trim()) {
            setLoading(false)
            return
          }
          secret = prompt(`Enter your ${integrations.find(i => i.id === id)?.name} API secret:`)
          if (!secret || !secret.trim()) {
            setLoading(false)
            return
          }
        } else if (provider === 'mixpanel') {
          token = prompt(`Enter your ${integrations.find(i => i.id === id)?.name} API key:`)
          if (!token || !token.trim()) {
            setLoading(false)
            return
          }
          projectId = prompt('Enter your Mixpanel Project ID (optional):')
        } else {
          token = prompt(`Enter your ${integrations.find(i => i.id === id)?.name} API key/token:`)
          if (!token || !token.trim()) {
            setLoading(false)
            return
          }
        }

        const additionalData: any = {}
        if (provider === 'airtable') {
          const baseId = prompt('Enter your Airtable Base ID (optional):')
          if (baseId) additionalData.base_id = baseId
        } else if (provider === 'coda') {
          const docId = prompt('Enter your Coda Doc ID (optional):')
          if (docId) additionalData.doc_id = docId
        } else if (provider === 'mixpanel' && projectId) {
          additionalData.project_id = projectId
        } else if (provider === 'amplitude' && secret) {
          additionalData.api_secret = secret
        }

        const res = await fetch(`/api/integrations/${provider}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            access_token: token.trim(),
            api_key: token.trim(), // For tally, mixpanel
            ...additionalData,
          }),
        })

        const data = await res.json()
        
        if (res.ok && data.success) {
          const integrationName = Object.values(integrationCategories).flat().find(i => i.id === id)?.name || id
          alert(`${integrationName} connected successfully!`)
          loadIntegrationStatus()
        } else {
          throw new Error(data.error || 'Failed to connect')
        }
        setLoading(false)
      } else {
        // For other providers, show coming soon
        alert(`$              {Object.values(integrationCategories).flat().find(i => i.id === id)?.name || id} integration coming soon!`)
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Connect error:', error)
      alert(`Failed to connect: ${error.message}`)
      setLoading(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    const integrationName = Object.values(integrationCategories).flat().find(i => i.id === id)?.name || id
    if (!confirm(`Are you sure you want to disconnect ${integrationName}?`)) {
      return
    }

    try {
      setLoading(true)
      
      // Map integration IDs to providers
      const providerMap: Record<string, string> = {
        'gmail': 'google',
        'google-calendar': 'google',
        'google-docs': 'google',
        'slack': 'slack',
        'stripe': 'stripe',
        'zoom': 'zoom',
      }

      const provider = providerMap[id]
      const integrationType = id.replace(/-/g, '_')

      const res = await fetch(
        `/api/integrations/disconnect?provider=${provider}&integration_type=${integrationType}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!res.ok) {
        throw new Error('Failed to disconnect')
      }

      // Reload status
      await loadIntegrationStatus()
      const integrationName = Object.values(integrationCategories).flat().find(i => i.id === id)?.name || id
      alert(`${integrationName} disconnected successfully`)
    } catch (error: any) {
      console.error('Disconnect error:', error)
      alert(`Failed to disconnect: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-zinc-950 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 dark:border-zinc-800">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <img src="/hydra.png" alt="Hydra" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Roadmap
            </Link>
            <Link href="/contacts" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Network
            </Link>
            <Link href="/documents" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Documents
            </Link>
            <Link href="/integrations" className="text-black dark:text-white dark:text-white font-medium">
              Integrations
            </Link>
            <Link href="/dev" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Dev
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-black dark:text-white">Integrations</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Connect your favorite tools to automate your workflow
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {mainCategories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-black dark:bg-white text-white'
                    : 'bg-white dark:bg-zinc-950 text-zinc-700 border border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900'
                }`}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Integration Grid by Category */}
        {selectedCategory === 'all' ? (
          <>
            {Object.entries(integrationCategories).map(([categoryName, categoryIntegrations]) => {
              const visibleIntegrations = categoryIntegrations
                .map(integration => {
                  const fullIntegration = integrations.find(i => i.id === integration.id)
                  return {
                    ...integration,
                    category: integration.sectionCategory,
                    connected: integrationStatus[integration.id] || false,
                  }
                })
                .filter(integration => {
                  const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                       integration.description.toLowerCase().includes(searchQuery.toLowerCase())
                  return matchesSearch
                })

              if (visibleIntegrations.length === 0) return null

              return (
                <div key={categoryName} className="mb-10">
                  <h3 className="text-lg font-bold text-black dark:text-white mb-4">{categoryName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleIntegrations.map((integration) => (
                      <div
                        key={integration.id}
                        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{integration.icon}</span>
                            <div>
                              <h3 className="text-base font-semibold text-black dark:text-white">{integration.name}</h3>
                              <span className="text-xs text-zinc-500">{integration.category}</span>
                            </div>
                          </div>
                          {integration.connected && (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Connected
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                          {integration.description}
                        </p>

                        {(integration as Integration & { comingSoon?: boolean }).comingSoon ? (
                          <button
                            disabled
                            className="w-full py-2 bg-zinc-100 text-zinc-400 text-sm font-medium rounded cursor-not-allowed"
                          >
                            Coming Soon
                          </button>
                        ) : integration.connected ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDisconnect(integration.id)}
                              disabled={loading}
                              className="flex-1 py-2 border border-zinc-300 text-zinc-700 text-sm font-medium rounded hover:bg-zinc-50 dark:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? '...' : 'Disconnect'}
                            </button>
                            <button className="flex-1 py-2 bg-black dark:bg-white text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors">
                              Settings
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnect(integration.id)}
                            disabled={loading}
                            className="w-full py-2 bg-black dark:bg-white text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Connecting...' : 'Connect'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {Object.values(integrationCategories).flat().length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-500">No integrations found matching your search.</p>
              </div>
            )}
          </>
        ) : (
          <>
            {filteredIntegrations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500">No integrations found matching your search.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-black dark:text-white mb-4">{selectedCategory}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredIntegrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-black dark:text-white">{integration.name}</h3>
                            <span className="text-xs text-zinc-500">{integration.category}</span>
                          </div>
                        </div>
                        {integration.connected && (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Connected
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                        {integration.description}
                      </p>

                      {(integration as Integration & { comingSoon?: boolean }).comingSoon ? (
                        <button
                          disabled
                          className="w-full py-2 bg-zinc-100 text-zinc-400 text-sm font-medium rounded cursor-not-allowed"
                        >
                          Coming Soon
                        </button>
                      ) : integration.connected ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDisconnect(integration.id)}
                            disabled={loading}
                            className="flex-1 py-2 border border-zinc-300 text-zinc-700 text-sm font-medium rounded hover:bg-zinc-50 dark:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? '...' : 'Disconnect'}
                          </button>
                          <button className="flex-1 py-2 bg-black dark:bg-white text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors">
                            Settings
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(integration.id)}
                          disabled={loading}
                          className="w-full py-2 bg-black dark:bg-white text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Connecting...' : 'Connect'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <IntegrationsContent />
    </Suspense>
  )
}
