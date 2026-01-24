'use client'

import { useState, useEffect } from 'react'

interface Activity {
  id: string
  activity_type: string
  title: string
  description: string | null
  actor_name: string | null
  actor_avatar_url: string | null
  icon: string | null
  created_at: string
  metadata: any
}

export default function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [limit])

  const loadActivities = async () => {
    try {
      const res = await fetch(`/api/activity?limit=${limit}`)
      const data = await res.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        <p className="text-2xl mb-2">📭</p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
        >
          {/* Icon/Avatar */}
          <div className="flex-shrink-0">
            {activity.actor_avatar_url ? (
              <img
                src={activity.actor_avatar_url}
                alt={activity.actor_name || 'User'}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg">
                {activity.icon || '📌'}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs font-medium text-black dark:text-white">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    {activity.description}
                  </p>
                )}
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {formatTimeAgo(activity.created_at)}
              </span>
            </div>

            {/* Metadata badges */}
            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <div className="flex gap-2 mt-2">
                {activity.metadata.role && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    {activity.metadata.role}
                  </span>
                )}
                {activity.metadata.category && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                    {activity.metadata.category}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
