'use client'

import { useState, useEffect, useRef } from 'react'
import AppLayout from '@/components/AppLayout'

interface Channel {
  id: string
  name: string
  unread_count: number
  member_count: number
}

interface Message {
  id: string
  sender_name: string
  sender_avatar_url: string | null
  content: string
  created_at: string
}

interface TeamMember {
  id: string
  name: string
  role: string
  avatar_url: string | null
  is_online: boolean
}

export default function CommunicationPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [connectingSlack, setConnectingSlack] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id)
    }
  }, [selectedChannel])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = async () => {
    try {
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      setUser(profileData)

      const res = await fetch('/api/communication')
      const data = await res.json()

      setChannels(data.channels || [])
      setTeamMembers(data.teamMembers || [])

      // Select first channel by default
      if (data.channels && data.channels.length > 0) {
        setSelectedChannel(data.channels[0])
      }
    } catch (error) {
      console.error('Error loading communication data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectSlack = async () => {
    setConnectingSlack(true)
    try {
      const res = await fetch('/api/integrations/slack/auth')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to get Slack auth URL')
      }
    } catch (error: any) {
      console.error('Error connecting Slack:', error)
      alert(error.message || 'Failed to connect Slack')
      setConnectingSlack(false)
    }
  }

  const loadMessages = async (channelId: string) => {
    try {
      const res = await fetch(`/api/communication?channelId=${channelId}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChannel) return

    try {
      await fetch('/api/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedChannel.id,
          content: newMessage,
          senderName: user?.full_name || 'You'
        })
      })

      setNewMessage('')
      loadMessages(selectedChannel.id)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <AppLayout user={user}>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Channel Sidebar */}
        <div className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
          {/* Channels Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                Channels
              </h2>
              <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Channel List */}
            <div className="space-y-1">
              {channels.length === 0 && !loading ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    No channels available. Connect Slack to get started.
                  </p>
                  <button
                    onClick={handleConnectSlack}
                    disabled={connectingSlack}
                    className="w-full px-4 py-2 bg-[#4A154B] hover:bg-[#5a1f5c] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connectingSlack ? 'Connecting...' : 'Connect Slack'}
                  </button>
                </div>
              ) : (
                channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedChannel?.id === channel.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-400">#</span>
                    <span className="text-sm font-medium">{channel.name}</span>
                  </span>
                  {channel.unread_count > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">
                      {channel.unread_count}
                    </span>
                  )}
                </button>
              ))
              )}
            </div>
          </div>

          {/* Team Members */}
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-3">
              Team
            </h2>
            <div className="space-y-2">
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="relative">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                        {getInitials(member.name)}
                      </div>
                    )}
                    {member.is_online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {member.name}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {member.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-900">
          {selectedChannel ? (
            <>
              {/* Channel Header */}
              <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">#</span>
                      <h1 className="text-lg font-semibold text-black dark:text-white">
                        {selectedChannel.name}
                      </h1>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {selectedChannel.member_count} members
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading ? (
                  <div className="text-center py-12 text-zinc-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      {message.sender_avatar_url ? (
                        <img
                          src={message.sender_avatar_url}
                          alt={message.sender_name}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {getInitials(message.sender_name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-black dark:text-white">
                            {message.sender_name}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 p-4">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message #${selectedChannel.name}`}
                    className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg text-sm text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                {channels.length === 0 && !loading ? (
                  <>
                    <p className="text-lg font-semibold text-black dark:text-white mb-2">
                      Connect Slack to get started
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                      Connect your Slack workspace to view channels and messages
                    </p>
                    <button
                      onClick={handleConnectSlack}
                      disabled={connectingSlack}
                      className="px-6 py-3 bg-[#4A154B] hover:bg-[#5a1f5c] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {connectingSlack ? 'Connecting...' : 'Connect Slack'}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Select a channel to start messaging
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
