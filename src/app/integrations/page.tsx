'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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

const integrations: Integration[] = [
  // Communication & Email
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'Email',
    description: 'Send and manage emails, automate outreach campaigns',
    icon: '📧',
    connected: true,
  },
  {
    id: 'outlook',
    name: 'Outlook',
    category: 'Email',
    description: 'Microsoft email integration for enterprise workflows',
    icon: '📨',
    connected: false,
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    description: 'Team messaging and notifications for updates',
    icon: '💬',
    connected: false,
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'Communication',
    description: 'Community management and team coordination',
    icon: '🎮',
    connected: false,
  },

  // Calendar & Scheduling
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'Calendar',
    description: 'Schedule meetings and sync your availability',
    icon: '📅',
    connected: true,
  },
  {
    id: 'calendly',
    name: 'Calendly',
    category: 'Scheduling',
    description: 'Automated scheduling links for customer meetings',
    icon: '🗓️',
    connected: false,
  },
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'Video',
    description: 'Video conferencing and virtual meetings',
    icon: '🎥',
    connected: false,
  },
  {
    id: 'fireflies',
    name: 'Fireflies.ai',
    category: 'Transcription',
    description: 'AI meeting transcription and note-taking',
    icon: '🎙️',
    connected: false,
  },

  // Productivity & Documentation
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    description: 'Sync tasks, documents, and knowledge base',
    icon: '📝',
    connected: false,
  },
  {
    id: 'google-docs',
    name: 'Google Docs',
    category: 'Documents',
    description: 'Create and share documents automatically',
    icon: '📄',
    connected: true,
  },
  {
    id: 'airtable',
    name: 'Airtable',
    category: 'Database',
    description: 'Flexible database for tracking everything',
    icon: '🗂️',
    connected: false,
  },
  {
    id: 'coda',
    name: 'Coda',
    category: 'Productivity',
    description: 'All-in-one doc for teams and workflows',
    icon: '📋',
    connected: false,
  },

  // Forms & Surveys
  {
    id: 'tally',
    name: 'Tally',
    category: 'Forms',
    description: 'Create beautiful forms and collect responses',
    icon: '📊',
    connected: false,
  },
  {
    id: 'typeform',
    name: 'Typeform',
    category: 'Forms',
    description: 'Interactive forms and surveys for user research',
    icon: '📝',
    connected: false,
  },
  {
    id: 'google-forms',
    name: 'Google Forms',
    category: 'Forms',
    description: 'Simple surveys and data collection',
    icon: '📋',
    connected: false,
  },

  // Product Management
  {
    id: 'productboard',
    name: 'ProductBoard',
    category: 'Product',
    description: 'Product roadmaps and feature prioritization',
    icon: '🎯',
    connected: false,
  },
  {
    id: 'linear',
    name: 'Linear',
    category: 'Project Management',
    description: 'Issue tracking and project management',
    icon: '⚡',
    connected: false,
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'Project Management',
    description: 'Agile project management for dev teams',
    icon: '🔷',
    connected: false,
  },
  {
    id: 'asana',
    name: 'Asana',
    category: 'Project Management',
    description: 'Task and project management platform',
    icon: '✓',
    connected: false,
  },

  // Development
  {
    id: 'github',
    name: 'GitHub',
    category: 'Development',
    description: 'Code repository and collaboration platform',
    icon: '🐙',
    connected: false,
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    category: 'Development',
    description: 'DevOps platform for complete CI/CD',
    icon: '🦊',
    connected: false,
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'Deployment',
    description: 'Deploy and host your web applications',
    icon: '▲',
    connected: false,
  },

  // Professional Networks
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'Networking',
    description: 'Professional networking and outreach',
    icon: '💼',
    connected: false,
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    category: 'Social',
    description: 'Social media engagement and content sharing',
    icon: '🐦',
    connected: false,
  },

  // Analytics & Tracking
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    category: 'Analytics',
    description: 'Website traffic and user behavior insights',
    icon: '📈',
    connected: false,
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    category: 'Analytics',
    description: 'Product analytics and user tracking',
    icon: '📊',
    connected: false,
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    category: 'Analytics',
    description: 'Behavioral analytics for product teams',
    icon: '📉',
    connected: false,
  },

  // Payment & Finance
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    description: 'Payment processing and billing automation',
    icon: '💳',
    connected: false,
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'Accounting',
    description: 'Financial management and bookkeeping',
    icon: '💰',
    connected: false,
  },

  // Customer Support
  {
    id: 'intercom',
    name: 'Intercom',
    category: 'Support',
    description: 'Customer messaging and support platform',
    icon: '💬',
    connected: false,
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    category: 'Support',
    description: 'Customer service and ticketing system',
    icon: '🎫',
    connected: false,
  },

  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'Marketing',
    description: 'Email marketing and campaign automation',
    icon: '🐵',
    connected: false,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    description: 'All-in-one CRM and marketing platform',
    icon: '🧲',
    connected: false,
  },
]

export default function IntegrationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const categories = ['all', ...Array.from(new Set(integrations.map(i => i.category)))]

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

  const filteredIntegrations = integrations.map(integration => ({
    ...integration,
    connected: integrationStatus[integration.id] || false, // Use database status instead of hardcoded
  })).filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory
    return matchesSearch && matchesCategory
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
          alert(`${integrations.find(i => i.id === id)?.name} connected successfully!`)
          loadIntegrationStatus()
        } else {
          throw new Error(data.error || 'Failed to connect')
        }
        setLoading(false)
      } else {
        // For other providers, show coming soon
        alert(`${integrations.find(i => i.id === id)?.name} integration coming soon!`)
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Connect error:', error)
      alert(`Failed to connect: ${error.message}`)
      setLoading(false)
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm(`Are you sure you want to disconnect ${integrations.find(i => i.id === id)?.name}?`)) {
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
      alert(`${integrations.find(i => i.id === id)?.name} disconnected successfully`)
    } catch (error: any) {
      console.error('Disconnect error:', error)
      alert(`Failed to disconnect: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-zinc-200">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-medium text-black">FounderOS</h1>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-zinc-600 hover:text-black transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-zinc-600 hover:text-black transition-colors">
              Roadmap
            </Link>
            <Link href="/contacts" className="text-zinc-600 hover:text-black transition-colors">
              Network
            </Link>
            <Link href="/documents" className="text-zinc-600 hover:text-black transition-colors">
              Documents
            </Link>
            <Link href="/integrations" className="text-black font-medium">
              Integrations
            </Link>
            <Link href="/dev" className="text-zinc-600 hover:text-black transition-colors">
              Dev
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-black">Integrations</h2>
          <p className="text-sm text-zinc-600 mt-1">
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
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-black text-white'
                    : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntegrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white border border-zinc-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <h3 className="text-base font-semibold text-black">{integration.name}</h3>
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

              <p className="text-sm text-zinc-600 mb-4 line-clamp-2">
                {integration.description}
              </p>

              {integration.comingSoon ? (
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
                    className="flex-1 py-2 border border-zinc-300 text-zinc-700 text-sm font-medium rounded hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '...' : 'Disconnect'}
                  </button>
                  <button className="flex-1 py-2 bg-black text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors">
                    Settings
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect(integration.id)}
                  disabled={loading}
                  className="w-full py-2 bg-black text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500">No integrations found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
