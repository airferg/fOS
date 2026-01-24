'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { PageBackground } from '@/components/PageBackground'
import IntegrationLogo from '@/components/IntegrationLogo'

interface Platform {
  id: string
  platform_name: string
  platform_handle: string | null
  followers: number
  reach: number
  engagement_rate: number
  growth_rate: number
  posts_count: number
  is_connected: boolean
}

const PLATFORM_CONFIG: Record<string, { icon: string; color: string }> = {
  'Twitter': { icon: '', color: 'bg-blue-400' },
  'YouTube': { icon: '', color: 'bg-red-500' },
  'Instagram': { icon: '', color: 'bg-pink-500' },
  'Facebook': { icon: '', color: 'bg-blue-600' },
  'LinkedIn': { icon: '', color: 'bg-blue-700' },
  'TikTok': { icon: '', color: 'bg-black' },
}

export default function MarketingPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showConnectionModal, setShowConnectionModal] = useState(false)

  const availablePlatforms = [
    { name: 'Twitter', handle: '@yourstartup' },
    { name: 'Instagram', handle: '@yourstartup' },
    { name: 'Facebook', handle: 'yourstartup' },
    { name: 'LinkedIn', handle: 'yourstartup' },
    { name: 'YouTube', handle: '@yourstartup' },
    { name: 'TikTok', handle: '@yourstartup' },
  ]

  useEffect(() => {
    loadPlatforms()
  }, [])

  const loadPlatforms = async () => {
    try {
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setUser(profileData)

      const res = await fetch('/api/marketing')
      const data = await res.json()
      setPlatforms(data.platforms || [])
    } catch (error) {
      console.error('Error loading marketing platforms:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectedPlatforms = platforms.filter(p => p.is_connected)

  const handleOAuthConnect = (platformName: string) => {
    // In production, this would redirect to OAuth flow
    const oauthUrls: Record<string, string> = {
      'Twitter': '/api/oauth/twitter',
      'Instagram': '/api/oauth/instagram',
      'Facebook': '/api/oauth/facebook',
      'LinkedIn': '/api/oauth/linkedin',
      'YouTube': '/api/oauth/youtube',
      'TikTok': '/api/oauth/tiktok',
    }

    const url = oauthUrls[platformName]
    if (url) {
      // For now, show alert. In production, would redirect to OAuth
      alert(`Connecting to ${platformName}...\n\nIn production, this would redirect to ${platformName}'s OAuth authorization page.`)
      // window.location.href = url
    }
  }

  return (
    <AppLayout user={user}>
      <PageBackground>
        <div className="p-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-center justify-between"
          >
          <div>
            <h1 className="text-xl font-semibold text-black dark:text-white leading-tight">
              Marketing
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Social media performance across connected platforms
            </p>
          </div>
          <button
            onClick={() => setShowConnectionModal(true)}
            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            + Connect Platform
          </button>
          </motion.div>

        {/* Platform Cards */}
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-zinc-500">Loading...</div>
          ) : connectedPlatforms.length > 0 ? (
            connectedPlatforms.map(platform => {
              const config = PLATFORM_CONFIG[platform.platform_name] || { icon: '', color: 'bg-zinc-500' }
              const isVideo = platform.platform_name === 'YouTube'

              return (
                <div
                  key={platform.id}
                  className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
                >
                  {/* Platform Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center text-xl`}>
                        {config.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-black dark:text-white">
                          {platform.platform_name}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {platform.platform_handle || `@${platform.platform_name.toLowerCase()}`}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                      Connected
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-semibold text-black dark:text-white">
                        {platform.followers.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {isVideo ? 'Subscribers' : 'Followers'}
                      </div>
                    </div>

                    <div>
                      <div className="text-2xl font-semibold text-black dark:text-white">
                        {(platform.reach / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {isVideo ? 'Views' : 'Reach'}
                      </div>
                    </div>

                    <div>
                      <div className="text-2xl font-semibold text-black dark:text-white">
                        {platform.engagement_rate}%
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Engagement
                      </div>
                    </div>
                  </div>

                  {/* Growth Indicator */}
                  <div className="flex items-center gap-1 text-sm mb-4">
                    <span className="text-green-600 dark:text-green-400">
                      ↑ +{platform.growth_rate}%
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      growth this week
                    </span>
                  </div>

                  {/* Bottom Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{(platform.followers * platform.engagement_rate / 100).toFixed(0)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>{Math.floor(platform.reach * 0.05)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <span>{Math.floor(platform.reach * 0.02)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">No platforms connected yet</p>
              <button
                onClick={() => setShowConnectionModal(true)}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Connect Platform
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connection Modal */}
      {showConnectionModal && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowConnectionModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-black dark:text-white">Connect Social Media</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Connect your social media accounts to track performance
                  </p>
                </div>
                <button
                  onClick={() => setShowConnectionModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Platform List */}
            <div className="p-4 space-y-2.5">
              {availablePlatforms.map((platform) => {
                const isConnected = connectedPlatforms.some(p => p.platform_name === platform.name)

                return (
                  <div
                    key={platform.name}
                    className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <IntegrationLogo name={platform.name} size="md" />
                      <div>
                        <div className="font-semibold text-black dark:text-white">{platform.name}</div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">{platform.handle}</div>
                      </div>
                    </div>

                    {isConnected ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium rounded-lg">
                          Connected
                        </span>
                        <button className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOAuthConnect(platform.name)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                      >
                        Connect {platform.name}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer Info */}
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Connecting your accounts is secure and allows Hydra to pull analytics data. You can disconnect at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </PageBackground>
    </AppLayout>
  )
}
