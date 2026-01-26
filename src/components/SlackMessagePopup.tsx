'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SlackMessage {
  id: string
  text: string
  user_name: string
  user_avatar?: string
  timestamp: string
  channel: string
}

interface SlackMessagePopupProps {
  channelId?: string
  channelName?: string
  limit?: number
}

export default function SlackMessagePopup({ channelId, channelName = 'general', limit = 5 }: SlackMessagePopupProps) {
  const [messages, setMessages] = useState<SlackMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [channelId])

  const loadMessages = async () => {
    try {
      const url = channelId
        ? `/api/slack/messages?channel=${channelId}&limit=${limit}`
        : `/api/slack/messages?limit=${limit}`

      const res = await fetch(url)

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setMessages(data.messages || [])
          setIsConnected(true)
        }
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Error loading Slack messages:', error)
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  if (!isConnected && !loading) {
    return (
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#4A154B] rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">Sl</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-black dark:text-white">Team Messages</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Connect Slack to see messages</p>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Connect Slack to view team messages
          </p>
          <a
            href="/api/oauth/slack"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A154B] text-white text-sm font-semibold rounded-lg hover:bg-[#611f69] transition-colors"
          >
            <span>Connect Slack</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#4A154B] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">Sl</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-black dark:text-white">
              #{channelName}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Team messages</p>
          </div>
        </div>
        <Link
          href="/communication"
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-zinc-500 text-sm">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No messages yet</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              {message.user_avatar ? (
                <img
                  src={message.user_avatar}
                  alt={message.user_name}
                  className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 dark:bg-zinc-800 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {getInitials(message.user_name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold text-black dark:text-white truncate">
                    {message.user_name}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {message.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/communication"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Open in Communication →
        </Link>
      </div>
    </div>
  )
}
