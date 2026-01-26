'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Channel {
  id: string
  name: string
  effort: 'low' | 'medium' | 'high'
  cost: number
  qualityRating: number
  status: 'Active' | 'Paused'
  source: string
}

const mockChannels: Channel[] = [
  {
    id: '1',
    name: 'LinkedIn',
    effort: 'medium',
    cost: 0,
    qualityRating: 4,
    status: 'Active',
    source: 'From LinkedIn'
  },
  {
    id: '2',
    name: 'Cold Email',
    effort: 'high',
    cost: 50,
    qualityRating: 3,
    status: 'Active',
    source: 'From Mailchimp'
  },
  {
    id: '3',
    name: 'Partnerships',
    effort: 'low',
    cost: 0,
    qualityRating: 5,
    status: 'Paused',
    source: 'Manual'
  },
  {
    id: '4',
    name: 'Communities',
    effort: 'medium',
    cost: 0,
    qualityRating: 4,
    status: 'Active',
    source: 'Manual'
  },
  {
    id: '5',
    name: 'SEO',
    effort: 'high',
    cost: 200,
    qualityRating: 2,
    status: 'Paused',
    source: 'From GA4'
  }
]

export default function ChannelFocusCard() {
  const [channels, setChannels] = useState<Channel[]>(mockChannels)
  const [showActivityModal, setShowActivityModal] = useState<string | null>(null)
  const [activityLog, setActivityLog] = useState('')

  const handleToggleStatus = (id: string) => {
    setChannels(channels.map(c => 
      c.id === id 
        ? { ...c, status: c.status === 'Active' ? 'Paused' : 'Active' }
        : c
    ))
  }

  const handleLogActivity = (id: string) => {
    setShowActivityModal(id)
    setActivityLog('')
  }

  const handleSaveActivity = () => {
    // In a real app, this would save to the database
    setShowActivityModal(null)
    setActivityLog('')
  }

  const getEffortColor = (effort: string) => {
    if (effort === 'low') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
    if (effort === 'medium') return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
    return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        className={i < rating ? 'text-orange-500' : 'text-zinc-300 dark:text-zinc-700'}
      >
        ★
      </span>
    ))
  }

  return (
    <>
      <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-black dark:text-white">Channel Focus</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Which channel is working?</p>
          </div>
        </div>

        <div className="p-4">
          {channels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No channels tracked yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((channel) => (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-black dark:text-white">{channel.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          channel.status === 'Active' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}>
                          {channel.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEffortColor(channel.effort)}`}>
                          {channel.effort} effort
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                        <span>Cost: ${channel.cost}/mo</span>
                        <div className="flex items-center gap-1">
                          <span>Quality:</span>
                          <span className="text-xs">{renderStars(channel.qualityRating)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleStatus(channel.id)}
                        className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        {channel.status === 'Active' ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleLogActivity(channel.id)}
                        className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                      >
                        Log Activity
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Source: {channel.source}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Activity Modal */}
      <AnimatePresence>
        {showActivityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowActivityModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  Log Activity - {channels.find(c => c.id === showActivityModal)?.name}
                </h3>
              </div>

              <div className="p-4">
                <textarea
                  value={activityLog}
                  onChange={(e) => setActivityLog(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={6}
                  placeholder="What did you do? What were the results? Any learnings?"
                />
              </div>

              <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowActivityModal(null)}
                  className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveActivity}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
