'use client'

import { motion, AnimatePresence } from 'framer-motion'
import IntegrationLogo from '@/components/IntegrationLogo'

interface ChannelAnalytics {
  id: string
  name: string
  handle: string
  followers: number
  reach: number
  engagementRate: number
  growthRate: number
  likes: number
  shares: number
  comments: number
  isConnected: boolean
}

const mockChannels: ChannelAnalytics[] = [
  {
    id: '1',
    name: 'Twitter',
    handle: '@NewFoundOS',
    followers: 4892,
    reach: 28400,
    engagementRate: 4.2,
    growthRate: 2.6,
    likes: 1200,
    shares: 389,
    comments: 156,
    isConnected: true
  },
  {
    id: '2',
    name: 'LinkedIn',
    handle: 'NewFoundOS',
    followers: 1234,
    reach: 8500,
    engagementRate: 5.8,
    growthRate: 3.2,
    likes: 450,
    shares: 120,
    comments: 89,
    isConnected: true
  },
  {
    id: '3',
    name: 'Instagram',
    handle: '@newfoundos',
    followers: 3200,
    reach: 15200,
    engagementRate: 6.5,
    growthRate: 4.1,
    likes: 980,
    shares: 245,
    comments: 178,
    isConnected: true
  }
]

interface MarketingChannelsSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function MarketingChannelsSidebar({ isOpen, onClose }: MarketingChannelsSidebarProps) {
  const connectedChannels = mockChannels.filter(c => c.isConnected)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 z-50 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-black dark:text-white">Marketing Channels</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {connectedChannels.length} connected
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <svg className="w-5 h-5 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Channels List */}
            <div className="p-4 space-y-4">
              {connectedChannels.map((channel, index) => (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
                >
                  {/* Channel Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {channel.name === 'Twitter' ? (
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        ) : (
                          <IntegrationLogo name={channel.name} size="sm" className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-black dark:text-white text-base">
                          {channel.name}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {channel.handle}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full flex-shrink-0">
                      Connected
                    </span>
                  </div>

                  {/* Main Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-semibold text-black dark:text-white">
                        {channel.followers.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Followers
                      </div>
                    </div>

                    <div>
                      <div className="text-2xl font-semibold text-black dark:text-white">
                        {(channel.reach / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Reach
                      </div>
                    </div>

                    <div>
                      <div className="text-2xl font-semibold text-black dark:text-white">
                        {channel.engagementRate}%
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Engagement
                      </div>
                    </div>
                  </div>

                  {/* Growth Indicator */}
                  <div className="flex items-center gap-1.5 text-sm mb-4">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      +{channel.growthRate}%
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      growth this week
                    </span>
                  </div>

                  {/* Interaction Counts */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span>{(channel.likes / 1000).toFixed(1)}K</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>{channel.shares}</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{channel.comments}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
