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
    const diffInHours = Math.floor(diffInSeconds / 3600)
    const diffInDays = Math.floor(diffInSeconds / 86400)

    // Format relative time
    let relativeTime = ''
    if (diffInSeconds < 60) {
      relativeTime = 'just now'
    } else if (diffInSeconds < 3600) {
      relativeTime = `${Math.floor(diffInSeconds / 60)}m ago`
    } else if (diffInSeconds < 86400) {
      relativeTime = `${diffInHours}h ago`
    } else if (diffInSeconds < 604800) {
      relativeTime = `${diffInDays}d ago`
    } else {
      relativeTime = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // Format absolute time
    const absoluteTime = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    // Return combined format like "2 hours ago • Jan 18, 2026 at 7:32 PM"
    if (diffInSeconds < 604800) {
      return `${relativeTime} • ${absoluteTime}`
    }
    return relativeTime
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

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getActivityIcon = (activityType: string) => {
    const iconMap: Record<string, string> = {
      'contact_added': '👤',
      'tool_connected': '🔌',
      'funding_received': '💰',
      'team_joined': '👥',
      'milestone_reached': '🎯',
      'document_created': '📄',
      'integration_connected': '🔗',
      'roadmap_updated': '🗺️',
    }
    return iconMap[activityType] || '📌'
  }

  return (
    <div className="space-y-0">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex gap-3 py-3 border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0"
        >
          {/* Avatar/Icon */}
          <div className="flex-shrink-0">
            {activity.actor_avatar_url ? (
              <img
                src={activity.actor_avatar_url}
                alt={activity.actor_name || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 dark:bg-zinc-800 flex items-center justify-center text-white text-xs font-medium">
                {activity.actor_name ? getInitials(activity.actor_name) : getActivityIcon(activity.activity_type)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-black dark:text-white leading-snug">
              {activity.title}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {formatTimeAgo(activity.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
