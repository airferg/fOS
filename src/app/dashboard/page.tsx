'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Message {
  role: 'assistant' | 'user'
  content: string
  actions?: Action[]
}

interface Action {
  type: 'email' | 'call' | 'document' | 'survey' | 'schedule' | 'agent_id'
  title: string
  details: string
  data: any
}

interface RoadmapItem {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  due_date: string
}

interface ProactiveAction {
  id: string
  title: string
  description: string
  icon: string
  action: Action
}

interface MissingIntegrationModal {
  show: boolean
  missingIntegrations: string[]
  taskTitle: string
}

interface AgentTask {
  id: string
  agent_id: string
  agent_name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: any
  output?: any
  error_message?: string
  created_at: string
  started_at?: string
  completed_at?: string
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([])
  const [proactiveActions, setProactiveActions] = useState<ProactiveAction[]>([])
  const [missingIntegrationModal, setMissingIntegrationModal] = useState<MissingIntegrationModal>({
    show: false,
    missingIntegrations: [],
    taskTitle: ''
  })
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; email: string | null; company: string | null; position: string | null }>>([])
  const [mentionMode, setMentionMode] = useState<{ active: boolean; query: string; startIndex: number; cursorPosition: number }>({ active: false, query: '', startIndex: 0, cursorPosition: 0 })
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timelineEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Close mention dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionMode.active && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        // Check if click was on a mention dropdown item
        const target = e.target as HTMLElement
        if (!target.closest('.mention-dropdown')) {
          setMentionMode({ active: false, query: '', startIndex: 0, cursorPosition: 0 })
        }
      }
    }
    
    if (mentionMode.active) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mentionMode.active])

  useEffect(() => {
    console.log('[Dashboard] Component mounted, loading data...')
    
    // Set up real-time subscription for agent tasks and load data after auth is confirmed
    let channel: any = null
    supabase.auth.getUser().then(({ data: { user }, error: authError }) => {
      if (authError) {
        console.error('[Dashboard] Auth error:', authError)
        return
      }
      
      if (user) {
        // Load data after auth is confirmed
        loadData()
        loadAgentTasks()
        loadContacts()
        // Load proactive actions after a small delay to ensure auth is fully settled
        setTimeout(() => {
          loadProactiveActions()
        }, 100)
        
        channel = supabase
          .channel('agent-tasks')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'agent_tasks',
            },
            (payload) => {
              console.log('[Dashboard] Agent task update:', payload)
              // Only update if it's for the current user
              if (payload.new && (payload.new as any).user_id === user.id) {
                loadAgentTasks()
              }
            }
          )
          .subscribe()
      } else {
        console.warn('[Dashboard] No user found on mount')
      }
    }).catch((error) => {
      console.error('[Dashboard] Error getting user:', error)
      // Still try to load data even if auth check fails
      loadData()
      loadAgentTasks()
    })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const loadAgentTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const res = await fetch('/api/agents/history?limit=20', { credentials: 'include' })
      if (res.ok) {
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json()
          setAgentTasks(data.tasks || [])
          
          // Scroll to bottom when new tasks are added
          setTimeout(() => {
            timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        } else {
          console.error('[Dashboard] Agent tasks response is not JSON:', contentType)
        }
      }
    } catch (error) {
      console.error('Error loading agent tasks:', error)
    }
  }
  
  // Debug: Log when messages change
  useEffect(() => {
    console.log('[Dashboard] Messages state changed:', messages.length, 'messages')
    if (messages.length > 0) {
      console.log('[Dashboard] Messages content:', messages.map(m => ({ role: m.role, content: m.content?.substring(0, 50) + '...' })))
    }
  }, [messages])
  
  // Debug: Log when chatOpen changes
  useEffect(() => {
    console.log('[Dashboard] Chat open state:', chatOpen)
  }, [chatOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Close attach menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false)
      }
    }

    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAttachMenu])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = async () => {
    try {
      // Load profile
      const profileRes = await fetch('/api/profile', { credentials: 'include' })
      const profileData = await profileRes.json()
      setProfile(profileData)

      // Load roadmap
      const roadmapRes = await fetch('/api/roadmap', { credentials: 'include' })
      const roadmapData = await roadmapRes.json()
      setRoadmap(roadmapData.items || [])

      // Load proactive messages (AI-initiated recommendations only)
      // Always check for new proactive messages on page load
      try {
        console.log('[Dashboard] Loading proactive messages...')
        const proactiveRes = await fetch('/api/chat/proactive', { credentials: 'include' })
        
        if (!proactiveRes.ok) {
          console.error('[Dashboard] Proactive messages fetch failed:', proactiveRes.status, proactiveRes.statusText)
          const contentType = proactiveRes.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await proactiveRes.json().catch(() => ({}))
            console.error('[Dashboard] Error response:', errorData)
          } else {
            const errorText = await proactiveRes.text()
            console.error('[Dashboard] Error response (non-JSON):', errorText.substring(0, 200))
          }
          return
        }
        
        // Check content-type before parsing
        const contentType = proactiveRes.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[Dashboard] Proactive messages response is not JSON:', contentType)
          return
        }
        
        const proactiveData = await proactiveRes.json()
        console.log('[Dashboard] Proactive messages response:', proactiveData)
        console.log('[Dashboard] Response has messages?', !!proactiveData.messages)
        console.log('[Dashboard] Messages array length:', proactiveData.messages?.length || 0)
        
        if (proactiveData.messages && proactiveData.messages.length > 0) {
          console.log(`[Dashboard] ✅ Found ${proactiveData.messages.length} proactive message(s)`)
          console.log('[Dashboard] First message:', proactiveData.messages[0])
          
          // Only show actual AI-generated proactive recommendations
          const chatMessages = proactiveData.messages.map((msg: any) => {
            // Handle both 'content' and 'message' fields from API
            const messageContent = msg.content || msg.message || ''
            console.log('[Dashboard] Mapping message:', { 
              id: msg.id, 
              role: msg.role, 
              hasContent: !!msg.content, 
              hasMessage: !!msg.message,
              contentLength: messageContent.length 
            })
            return {
              role: msg.role || 'assistant',
              content: messageContent,
              actions: msg.suggestedActions || msg.actions || [],
              isProactive: msg.isProactive !== false, // Default to true if not specified
            }
          })
          
          console.log('[Dashboard] ✅ Mapped chat messages:', chatMessages)
          console.log('[Dashboard] Current messages state before update:', messages.length)
          
          // Set messages and open chat
          setMessages(chatMessages)
          
          // Auto-open chat if there are proactive messages
          if (chatMessages.length > 0) {
            console.log('[Dashboard] ✅ Auto-opening chat window')
            setChatOpen(true)
          }
          
          // Verify messages were set (use setTimeout to check after state update)
          setTimeout(() => {
            console.log('[Dashboard] Messages state after update (check):', messages.length)
          }, 100)

          // Mark messages as delivered (async, don't block)
          for (const msg of proactiveData.messages) {
            if (msg.id && msg.isProactive) {
              // Only mark real database records (UUIDs), not generated greetings
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msg.id)
              if (isUUID) {
                console.log('[Dashboard] Marking message as delivered:', msg.id)
                fetch('/api/chat/proactive', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ messageId: msg.id })
                })
                .then(async (res) => {
                  if (!res.ok) {
                    const contentType = res.headers.get('content-type')
                    if (contentType && contentType.includes('application/json')) {
                      const errorData = await res.json().catch(() => ({}))
                      console.error('[Dashboard] Mark delivered error:', errorData)
                    } else {
                      const errorText = await res.text().catch(() => 'Could not read error')
                      console.error('[Dashboard] Mark delivered error (non-JSON):', errorText.substring(0, 200))
                    }
                  } else {
                    console.log('[Dashboard] Message marked as delivered successfully')
                  }
                })
                .catch((error) => {
                  console.error('[Dashboard] Failed to mark message as delivered:', error)
                })
              }
            }
          }
        } else {
          console.log('[Dashboard] ⚠️  No proactive messages found in response')
          console.log('[Dashboard] Response data:', JSON.stringify(proactiveData, null, 2))
        }
        // No fallback greeting - only show actual AI recommendations
      } catch (error: any) {
        console.error('[Dashboard] ❌ Error loading proactive messages:', error)
        console.error('[Dashboard] Error details:', error.message, error.stack)
        // Don't show fallback greeting - only real recommendations
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  // Parse mentions from message (format: @Name or @Name)
  const parseMentions = (text: string) => {
    const mentionRegex = /@([^\s@]+)/g
    const matches = [...text.matchAll(mentionRegex)]
    const mentionedNames = matches.map(m => m[1])
    const mentionedContacts = contacts.filter(c => 
      mentionedNames.some(name => 
        c.name.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(c.name.toLowerCase())
      )
    )
    return mentionedContacts
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    
    // Parse mentions from the message
    const mentionedContacts = parseMentions(userMessage)
    
    setInput('')
    setMentionMode({ active: false, query: '', startIndex: 0, cursorPosition: 0 })
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          mentionedContacts: mentionedContacts.length > 0 ? mentionedContacts : undefined,
        }),
      })

      const contentType = res.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')
      
      if (!res.ok) {
        const errorData = isJson
          ? await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
          : { error: `HTTP ${res.status}: ${res.statusText}` }
        throw new Error(errorData.error || 'Chat request failed')
      }

      let data: any
      try {
        if (!isJson) {
          const text = await res.text()
          console.warn('[Dashboard] ⚠️ Chat API returned non-JSON:', { status: res.status, contentType, preview: text.substring(0, 200) })
          throw new Error(`Chat API returned HTML instead of JSON (Status: ${res.status})`)
        }
        data = await res.json()
      } catch (parseError: any) {
        console.error('[Dashboard] ❌ Failed to parse chat response:', parseError)
        throw new Error(`Failed to parse chat response: ${parseError.message}`)
      }

      if (data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            actions: data.actions,
          },
        ])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (action: Action) => {
    setLoading(true)

    // Immediately add task to timeline with "running" status
    const tempTaskId = `temp-${Date.now()}`
    // Determine agent ID for task tracking
    const agentIdForTask = action.type === 'agent_id' 
      ? (action.data?.id || action.data?.agentId || 'unknown')
      : (action.data?.agentId || 'unknown')
    
    const newTask: AgentTask = {
      id: tempTaskId,
      agent_id: agentIdForTask,
      agent_name: action.title,
      status: 'running',
      input: action.data || {},
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
    }
    
    setAgentTasks((prev) => [newTask, ...prev])

    try {
      // Check if this is an AI agent action
      // Can be identified by: action.type === "agent_id" OR action.data?.agentId exists
      const isAgentAction = action.type === 'agent_id' || !!action.data?.agentId
      
      if (isAgentAction) {
        // Extract agentId - same logic as used for task tracking
        const agentId = action.type === 'agent_id' 
          ? (action.data?.id || action.data?.agentId || action.data?.agent_id || 'task-executor')
          : (action.data?.agentId || 'task-executor')
        
        if (!agentId || agentId === 'unknown') {
          console.error('[Dashboard] ❌ Agent action missing agentId:', action)
          setAgentTasks((prev) => 
            prev.map((task) => 
              task.id === tempTaskId
                ? { ...task, status: 'failed' as const, completed_at: new Date().toISOString(), error_message: 'Agent ID missing from action' }
                : task
            )
          )
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Failed: Agent ID missing from action. Please try again.' },
          ])
          setChatOpen(true)
          setLoading(false)
          return
        }
        console.log('[Dashboard] 🚀 Executing agent action:', {
          agentId,
          actionType: action.type,
          actionTitle: action.title
        })
        
        const res = await fetch('/api/agents/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            agentId,
            input: action.data?.input || action.data || {}
          }),
        })
        
        console.log('[Dashboard] 📡 Agent response status:', {
          status: res.status,
          ok: res.ok,
          contentType: res.headers.get('content-type'),
          url: res.url
        })

        // Check content-type FIRST before consuming response body
        const contentType = res.headers.get('content-type')
        const isJson = contentType && contentType.includes('application/json')
        
        let result: any
        
        try {
          // If response is not OK
          if (!res.ok) {
            const errorData = isJson
              ? await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }))
              : { error: `HTTP ${res.status}: ${res.statusText}` }
            
            // If unauthorized, use the error message from the API
            if (res.status === 401) {
              const errorMsg = errorData.error || 'Unauthorized. Please log out and log back in.'
              setAgentTasks((prev) => 
                prev.map((task) => 
                  task.id === tempTaskId
                    ? { ...task, status: 'failed' as const, completed_at: new Date().toISOString(), error_message: errorMsg }
                    : task
                )
              )
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `Failed: ${errorMsg}` },
              ])
              setChatOpen(true)
              setLoading(false)
              return
            }
            
            const errorMsg = errorData.error || `HTTP ${res.status}: ${res.statusText}`
            setAgentTasks((prev) => 
              prev.map((task) => 
                task.id === tempTaskId
                  ? { ...task, status: 'failed' as const, completed_at: new Date().toISOString(), error_message: errorMsg }
                  : task
              )
            )
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: `Failed: ${errorMsg}` },
            ])
            setChatOpen(true)
            setLoading(false)
            return
          }

          // Response is OK - check if it's JSON
          if (!isJson) {
            const text = await res.text()
            const logData = {
              status: res.status,
              statusText: res.statusText,
              contentType,
              url: res.url,
              preview: text.substring(0, 500)
            }
            console.warn('[Dashboard] ⚠️ Non-JSON response detected:', logData)
            console.error('[Dashboard] ❌ Full error details:', JSON.stringify(logData, null, 2))
            
            // Try to extract error message from HTML
            const errorMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                              text.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                              text.match(/<pre[^>]*>([^<]+)<\/pre>/i)
            const errorMsg = errorMatch ? errorMatch[1] : `Server error: API returned HTML instead of JSON (Status: ${res.status})`
            
            setAgentTasks((prev) => 
              prev.map((task) => 
                task.id === tempTaskId
                  ? { ...task, status: 'failed' as const, completed_at: new Date().toISOString(), error_message: errorMsg }
                  : task
              )
            )
            
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: `Failed: ${errorMsg}` },
            ])
            setChatOpen(true)
            setLoading(false)
            return
          }
          
          // Response is OK and JSON - parse it
          result = await res.json()
          console.log('[Dashboard] ✅ Successfully parsed agent response:', {
            success: result?.success,
            hasData: !!result?.data
          })
        } catch (parseError: any) {
          const errorDetails = {
            error: parseError.message,
            errorName: parseError.name,
            status: res.status,
            contentType,
            url: res.url,
            stack: parseError.stack?.split('\n').slice(0, 3)
          }
          console.warn('[Dashboard] ⚠️ Parse error caught:', errorDetails)
          console.error('[Dashboard] ❌ Full parse error:', JSON.stringify(errorDetails, null, 2))
          
          const errorMsg = `Failed to parse server response: ${parseError.message}`
          
          setAgentTasks((prev) => 
            prev.map((task) => 
              task.id === tempTaskId
                ? { ...task, status: 'failed' as const, completed_at: new Date().toISOString(), error_message: errorMsg }
                : task
            )
          )
          
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `Failed: ${errorMsg}` },
          ])
          setChatOpen(true)
          setLoading(false)
          return
        }

        if (result.success) {
          // Update task status to completed
          setAgentTasks((prev) => 
            prev.map((task) => 
              task.id === tempTaskId
                ? { ...task, status: 'completed' as const, completed_at: new Date().toISOString(), output: result.data }
                : task
            )
          )
          
          // Refresh to get the actual task from database
          loadAgentTasks()

          // Format the result based on agent type - keep it SHORT
          let message = `✓ ${action.title} completed!`

          // Extract all links from tool results
          const links: Array<{ type: string; url: string; label?: string }> = []
          
          // Check tool action results for links
          if (result.data?.actions) {
            for (const actionResult of result.data.actions) {
              const toolResult = actionResult.result
              if (typeof toolResult === 'object' && toolResult !== null) {
                // Google Docs
                if (toolResult.url) {
                  links.push({ type: 'document', url: toolResult.url, label: toolResult.title || 'Document' })
                }
                // Calendar events
                if (toolResult.htmlLink) {
                  links.push({ type: 'calendar', url: toolResult.htmlLink, label: toolResult.summary || 'Calendar Event' })
                }
                // Gmail drafts
                if (toolResult.draftLink) {
                  links.push({ type: 'email', url: toolResult.draftLink, label: 'Email Draft' })
                }
                // Check nested structures (document, email, calendar objects)
                if (toolResult.document?.url) {
                  links.push({ type: 'document', url: toolResult.document.url, label: toolResult.document.title || 'Document' })
                }
                if (toolResult.email?.url || toolResult.email?.draftLink) {
                  links.push({ type: 'email', url: toolResult.email.url || toolResult.email.draftLink, label: toolResult.email.subject || 'Email' })
                }
                if (toolResult.calendar?.htmlLink || toolResult.event?.htmlLink) {
                  links.push({ type: 'calendar', url: toolResult.calendar?.htmlLink || toolResult.event?.htmlLink, label: toolResult.calendar?.summary || toolResult.event?.summary || 'Calendar Event' })
                }
              }
            }
          }

          // Handle task executor results (agentic system)
          if (result.data?.result) {
            const resultText = result.data.result
            // Truncate if too long
            message += resultText.length > 150 ? `\n\n${resultText.substring(0, 150)}...` : `\n\n${resultText}`
          } else if (result.data?.email) {
            message += `\n\nEmail drafted: "${result.data.email.subject}"`
            if (result.data.email.url || result.data.email.draftLink) {
              links.push({ type: 'email', url: result.data.email.url || result.data.email.draftLink, label: result.data.email.subject || 'Email' })
            }
          } else if (result.data?.document) {
            message += `\n\nDocument created: "${result.data.document.title}"`
            if (result.data.document.url) {
              links.push({ type: 'document', url: result.data.document.url, label: result.data.document.title || 'Document' })
            }
          } else if (result.data?.analysis) {
            message += `\n\nAnalysis complete`
          }

          // Add all links to the message
          if (links.length > 0) {
            message += `\n\n**Links:**\n`
            links.forEach((link, index) => {
              const icon = link.type === 'document' ? '📄' : link.type === 'email' ? '📧' : link.type === 'calendar' ? '📅' : '🔗'
              message += `${icon} [${link.label || 'View'}](${link.url})`
              if (index < links.length - 1) message += '\n'
            })
          }

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: message,
            },
          ])

          // Open chat to show results
          setChatOpen(true)
        } else {
          // Update task status to failed
          setAgentTasks((prev) => 
            prev.map((task) => 
              task.id === tempTaskId
                ? { ...task, status: 'failed' as const, completed_at: new Date().toISOString(), error_message: result.error || 'Agent execution failed' }
                : task
            )
          )
          
          throw new Error(result.error || 'Agent execution failed')
        }
      } else {
        // Legacy action execution (for backwards compatibility)
        let endpoint = ''
        let body = {}

        switch (action.type) {
          case 'email':
            endpoint = '/api/actions/send-email'
            body = action.data
            break
          case 'document':
            endpoint = '/api/actions/generate-document'
            body = action.data
            break
          case 'schedule':
            endpoint = '/api/actions/schedule-call'
            body = action.data
            break
          case 'survey':
            // Survey endpoint doesn't exist yet - skip for now
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: 'Survey functionality is not yet available. Please use agent actions instead.' },
            ])
            setChatOpen(true)
            setLoading(false)
            return
        }

        if (!endpoint) {
          console.error('[Dashboard] ❌ No endpoint found for action type:', action.type)
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `Action type "${action.type}" is not supported. Please use agent actions instead.` },
          ])
          setChatOpen(true)
          setLoading(false)
          return
        }

        console.log('[Dashboard] 🚀 Executing legacy action:', {
          type: action.type,
          endpoint,
          hasData: !!body
        })

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })

        const contentType = res.headers.get('content-type')
        const isJson = contentType && contentType.includes('application/json')
        
        if (!res.ok) {
          const errorData = isJson
            ? await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
            : { error: `HTTP ${res.status}: ${res.statusText}` }
          throw new Error(errorData.error || 'Action execution failed')
        }

        let result: any
        try {
          if (!isJson) {
            const text = await res.text()
            const errorDetails = { 
              actionType: action.type, 
              endpoint,
              status: res.status, 
              statusText: res.statusText,
              contentType, 
              preview: text.substring(0, 500),
              url: res.url
            }
            console.warn('[Dashboard] ⚠️ Legacy action API returned non-JSON:', errorDetails)
            console.error('[Dashboard] ❌ Full error details:', JSON.stringify(errorDetails, null, 2))
            
            // Try to extract error from HTML
            const errorMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                              text.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                              text.match(/<pre[^>]*>([^<]+)<\/pre>/i)
            const errorMsg = errorMatch 
              ? `${action.type} action failed: ${errorMatch[1]}`
              : `Action API returned HTML instead of JSON. The ${action.type} endpoint may have an error.`
            
            setAgentTasks((prev) => 
              prev.map((task) => 
                task.id === tempTaskId
                  ? { ...task, status: 'failed' as const, completed_at: new Date().toISOString(), error_message: errorMsg }
                  : task
              )
            )
            
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: `Failed: ${errorMsg}` },
            ])
            setChatOpen(true)
            setLoading(false)
            return
          }
          result = await res.json()
          console.log('[Dashboard] ✅ Legacy action response parsed:', {
            actionType: action.type,
            hasMessage: !!result.message
          })
        } catch (parseError: any) {
          console.error('[Dashboard] ❌ Failed to parse legacy action response:', {
            error: parseError.message,
            actionType: action.type,
            endpoint,
            status: res.status,
            contentType
          })
          
          const errorMsg = `Failed to parse ${action.type} action response: ${parseError.message}`
          
          setAgentTasks((prev) => 
            prev.map((task) => 
              task.id === tempTaskId
                ? { ...task, status: 'failed' as const, completed_at: new Date().toISOString(), error_message: errorMsg }
                : task
            )
          )
          
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `Failed: ${errorMsg}` },
          ])
          setChatOpen(true)
          setLoading(false)
          return
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.message || `Action completed: ${action.title}`,
          },
        ])
      }

      // Refresh roadmap
      loadData()
      
      // Refresh tasks to get final state
      loadAgentTasks()
      
      // Refresh proactive actions to update suggestions based on completed tasks
      loadProactiveActions()
    } catch (error: any) {
      console.error('Action execution error:', error)
      
      // Update task status to failed
      setAgentTasks((prev) => 
        prev.map((task) => 
          task.id === tempTaskId
            ? { ...task, status: 'failed' as const, completed_at: new Date().toISOString(), error_message: error.message }
            : task
        )
      )
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Failed: ${error.message}` },
      ])
      setChatOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const upcomingTasks = roadmap.filter((item) => item.status === 'todo').slice(0, 3)
  const inProgressTasks = roadmap.filter((item) => item.status === 'in_progress')

  // Load proactive actions from the proactive system
  const loadContacts = async () => {
    try {
      const res = await fetch('/api/contacts?limit=100')
      const data = await res.json()
      setContacts(data.contacts || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
    }
  }

  const loadProactiveActions = async () => {
    try {
      console.log('[Dashboard] Loading proactive actions...')
      
      // Check if user is authenticated first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.warn('[Dashboard] User not authenticated, skipping proactive actions load')
        setProactiveActions([])
        return
      }
      
      const res = await fetch('/api/chat/proactive', { 
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!res.ok) {
        console.error('[Dashboard] Failed to load proactive actions:', res.status, res.statusText)
        // Fallback to empty array if API fails
        setProactiveActions([])
        return
      }
      
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[Dashboard] Proactive actions response is not JSON:', contentType)
        setProactiveActions([])
        return
      }
      
      const data = await res.json()
      const messages = data.messages || []
      
      // Convert proactive messages' suggested actions to ProactiveAction format
      const actions: ProactiveAction[] = []
      const iconMap: Record<string, string> = {
        'meeting': '📅',
        'email': '📧',
        'document': '📄',
        'investor': '📈',
        'follow-up': '📧',
        'follow up': '📧',
        'prepare': '📅',
        'calendar': '📅',
        'spec': '📋',
        'product': '📋'
      }
      
      // Get actions from the most recent proactive messages (up to 3)
      for (const message of messages.slice(0, 3)) {
        const suggestedActions = message.suggestedActions || []
        
        for (const suggestedAction of suggestedActions) {
          // Determine icon based on title/keywords
          let icon = '🤖'
          const titleLower = (suggestedAction.title || '').toLowerCase()
          for (const [keyword, emoji] of Object.entries(iconMap)) {
            if (titleLower.includes(keyword)) {
              icon = emoji
              break
            }
          }
          
          // Extract description from message or use a default
          let description = suggestedAction.details || suggestedAction.title || ''
          if (!description && message.content) {
            // Try to extract a short description from the message
            const sentences = message.content.split(/[.!?]/).filter((s: string) => s.trim().length > 0)
            if (sentences.length > 0) {
              description = sentences[0].trim().substring(0, 100)
            }
          }
          
          actions.push({
            id: `${message.id}-${suggestedAction.title || Math.random()}`,
            title: suggestedAction.title || 'Suggested Action',
            description: description.substring(0, 150),
            icon,
            action: {
              type: suggestedAction.type || 'agent_id',
              title: suggestedAction.title || 'Execute',
              details: suggestedAction.details || '',
              data: suggestedAction.data || {}
            }
          })
        }
        
        // Stop after collecting up to 3 actions
        if (actions.length >= 3) break
      }
      
      // If no actions from proactive messages, use empty array (no fallback)
      setProactiveActions(actions)
      console.log('[Dashboard] Loaded', actions.length, 'proactive actions')
    } catch (error: any) {
      console.error('[Dashboard] Error loading proactive actions:', error)
      setProactiveActions([])
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-zinc-200">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-medium text-black">FounderOS</h1>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-black font-medium">
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
            <Link href="/agents" className="text-zinc-600 hover:text-black transition-colors">
              AI Agents
            </Link>
            <Link href="/integrations" className="text-zinc-600 hover:text-black transition-colors">
              Integrations
            </Link>
            <Link href="/dev" className="text-zinc-600 hover:text-black transition-colors">
              Dev
            </Link>
            <button
              onClick={handleSignOut}
              className="text-zinc-600 hover:text-black transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Metrics */}
        <div className="w-80 bg-white border-r border-zinc-200 p-6 overflow-y-auto">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Your Resources
          </h2>

          <div className="space-y-4">
            {/* Time Availability Card */}
            <div className="p-4 border border-zinc-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-600">Time Available</span>
                <span className="text-2xl">⏰</span>
              </div>
              <div className="text-2xl font-bold text-black">
                {profile?.hours_per_week || 0}
                <span className="text-sm font-normal text-zinc-500"> hrs/week</span>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                ~{Math.round((profile?.hours_per_week || 0) / 7)} hrs/day
              </div>
            </div>

            {/* Budget Card */}
            <div className="p-4 border border-zinc-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-600">Budget</span>
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-2xl font-bold text-black">
                ${(profile?.funds_available || 0).toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                Available funds
              </div>
            </div>

            {/* Team Card */}
            <div className="p-4 border border-zinc-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-600">Team</span>
                <span className="text-2xl">👥</span>
              </div>
              <div className="text-2xl font-bold text-black">
                {profile?.team_size || 1}
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                {profile?.team_size === 1 ? 'Solo founder' : 'Team members'}
              </div>
            </div>

            {/* Connections Preview Card */}
            <div className="p-4 border border-zinc-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-600">Network</span>
                <span className="text-2xl">🌐</span>
              </div>
              <div className="text-2xl font-bold text-black">
                24
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                Active connections
              </div>
              <Link
                href="/contacts"
                className="mt-2 text-xs text-black hover:underline inline-block"
              >
                View all →
              </Link>
            </div>

            {/* Roadmap Preview Card */}
            <div className="p-4 border border-zinc-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-600">Roadmap</span>
                <span className="text-2xl">🗺️</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600">Todo</span>
                  <span className="font-medium text-black">{upcomingTasks.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600">In Progress</span>
                  <span className="font-medium text-black">{inProgressTasks.length}</span>
                </div>
              </div>
              <Link
                href="/roadmap"
                className="mt-2 text-xs text-black hover:underline inline-block"
              >
                View roadmap →
              </Link>
            </div>

            {/* Current Goal Card */}
            <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50">
              <div className="text-xs font-medium text-zinc-600 mb-2">Current Goal</div>
              <div className="text-sm text-black font-medium">
                {profile?.current_goal || 'Loading...'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Proactive Actions Bar */}
          <div className="bg-white border-b border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-black">Today's Suggestions</h2>
                <p className="text-sm text-zinc-500">{today}</p>
              </div>
            </div>

            <div className="space-y-3">
              {proactiveActions.length > 0 ? (
                proactiveActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{action.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-black">{action.title}</div>
                        <div className="text-xs text-zinc-600">{action.description}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => executeAction(action.action)}
                      disabled={loading}
                      className="px-4 py-2 bg-black text-white text-xs font-medium rounded hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Execute
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 border border-zinc-200 rounded-lg text-center">
                  <p className="text-sm text-zinc-500">No suggestions at this time</p>
                  <p className="text-xs text-zinc-400 mt-1">Check back later for personalized recommendations</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Live Timeline */}
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <h3 className="text-base font-semibold text-black mb-4">Activity Timeline</h3>
              <div className="space-y-0 relative">
                {agentTasks.length > 0 ? (
                  agentTasks.map((task, index) => {
                    const isLast = index === agentTasks.length - 1
                    const statusConfig = {
                      pending: { label: 'Initialized', color: 'text-zinc-600', icon: null },
                      running: { label: 'Running', color: 'text-black', icon: 'animate-spin' },
                      completed: { label: 'Completed', color: 'text-zinc-600', icon: '✓' },
                      failed: { label: 'Failed', color: 'text-red-500', icon: '✕' }
                    }
                    const config = statusConfig[task.status]
                    
                    // Format timestamp
                    const timestamp = task.completed_at || task.started_at || task.created_at
                    const date = new Date(timestamp)
                    const formattedDate = date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })
                    
                    // Extract task title from agent_name or input
                    const taskTitle = task.agent_name || task.agent_id || 'Agent Task'
                    
                    // Extract steps from output if available
                    const steps = task.output?.actions || task.output?.steps || []
                    const currentStep = task.status === 'running' && task.output?.currentStep
                    
                    return (
                      <div key={task.id} className="relative flex gap-3 pb-6 group transition-all duration-300">
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full border border-zinc-300 transition-all duration-300 ${
                            task.status === 'completed' ? 'bg-black border-black' :
                            task.status === 'failed' ? 'bg-red-500 border-red-500' :
                            task.status === 'running' ? 'bg-black border-black animate-pulse' :
                            'bg-zinc-200 border-zinc-300'
                          }`} />
                          {!isLast && (
                            <div className="w-px h-full bg-zinc-200 mt-1.5" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 opacity-0 animate-[fadeIn_0.5s_ease-out_0.1s_forwards]">
                          {/* Task title and status */}
                          <div className="mb-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {task.status === 'failed' && (
                                <span className="text-sm font-semibold text-red-500">Error:</span>
                              )}
                              {task.status === 'completed' && (
                                <span className="text-sm font-semibold text-black">Success:</span>
                              )}
                              <span className={`text-sm font-semibold ${
                                task.status === 'failed' ? 'text-red-500' : 'text-black'
                              }`}>
                                {taskTitle}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs ${config.color} transition-colors duration-300`}>
                                {config.label}
                              </span>
                              {task.status === 'completed' && (
                                <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {task.status === 'failed' && (
                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              <span className="text-xs text-zinc-500">{formattedDate}</span>
                            </div>
                          </div>
                          
                          {/* Error message */}
                          {task.status === 'failed' && task.error_message && (
                            <p className="text-sm text-red-500 mb-3 opacity-0 animate-[fadeIn_0.3s_ease-out_0.2s_forwards]">
                              {task.error_message}
                            </p>
                          )}
                          
                          {/* Steps/Sub-tasks */}
                          {(steps.length > 0 || currentStep) && (
                            <div className="space-y-1.5 mt-3 ml-1">
                              {currentStep && (
                                <div className="flex items-center gap-2 text-sm text-black opacity-0 animate-[fadeIn_0.3s_ease-out_0.3s_forwards]">
                                  <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse flex-shrink-0" />
                                  <span>{currentStep}</span>
                                </div>
                              )}
                              {steps.map((step: any, stepIndex: number) => {
                                let stepText = ''
                                if (typeof step === 'string') {
                                  stepText = step
                                } else if (step.tool) {
                                  // Format tool names to be more readable
                                  const toolName = step.tool.replace(/_/g, ' ')
                                    .split(' ')
                                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ')
                                  
                                  // Add context based on tool result
                                  if (step.result) {
                                    if (step.result.url || step.result.draftLink) {
                                      stepText = toolName.includes('Email') || toolName.includes('Draft')
                                        ? `Drafted ${toolName.toLowerCase().replace('draft ', '')} template`
                                        : toolName.includes('Document') || toolName.includes('Doc')
                                        ? `Created ${toolName.toLowerCase().replace('create ', '')} in Google Docs`
                                        : `${toolName} completed`
                                    } else {
                                      stepText = `${toolName} completed`
                                    }
                                  } else {
                                    stepText = `${toolName}...`
                                  }
                                } else {
                                  stepText = step.title || step.description || 'Step completed'
                                }
                                
                                const delay = 0.4 + (stepIndex * 0.05)
                                return (
                                  <div 
                                    key={stepIndex} 
                                    className="flex items-center gap-2 text-sm text-zinc-600 opacity-0 animate-[fadeInSlide_0.3s_ease-out_forwards]"
                                    style={{ animationDelay: `${delay}s` }}
                                  >
                                    <svg className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="leading-relaxed">{stepText}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          
                          {/* Running indicator */}
                          {task.status === 'running' && !currentStep && steps.length === 0 && (
                            <div className="flex items-center gap-2 text-sm text-black mt-3 ml-1 animate-pulse">
                              <div className="w-1.5 h-1.5 rounded-full bg-black" />
                              <span>Processing...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-zinc-500">No recent activity</p>
                    <p className="text-xs text-zinc-400 mt-1">Agent tasks will appear here as they execute</p>
                  </div>
                )}
                <div ref={timelineEndRef} />
              </div>
            </div>
          </div>

          {/* AI Chat - Notion-style Bottom Right */}
          <div
            className={`fixed bottom-6 right-6 z-50 bg-white border border-blue-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ease-out ${
              chatOpen
                ? 'w-[30vw] h-[50vh] rounded-xl'
                : 'w-14 h-14 rounded-full'
            } ${isAnimating ? '' : ''}`}
            style={{
              transition: chatOpen
                ? 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), height 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), height 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {!chatOpen ? (
              // Unopened State: Circle with fOS Logo
              <button
                onClick={() => {
                  setIsAnimating(true)
                  setChatOpen(true)
                  setTimeout(() => setIsAnimating(false), 500)
                }}
                className="w-full h-full flex items-center justify-center relative hover:bg-zinc-50 transition-colors rounded-full bg-white"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-black">fOS</span>
                </div>
                {messages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            ) : (
              // Opened State: Full Chat Interface
              <>
                {/* Top Menu Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                  <div className="flex items-center gap-3">
                    <button className="px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 rounded-md flex items-center gap-1.5 transition-colors font-medium border border-zinc-200 bg-zinc-50">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <defs>
                          <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF6B6B" />
                            <stop offset="50%" stopColor="#4ECDC4" />
                            <stop offset="100%" stopColor="#45B7D1" />
                          </linearGradient>
                        </defs>
                        <path d="M4.5 16.5c0 1.38 2.24 2.5 5 2.5s5-1.12 5-2.5" stroke="url(#rocketGradient)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                        <path d="M9.5 19c0 1.38 1.5 2.5 4.5 2.5s4.5-1.12 4.5-2.5" stroke="url(#rocketGradient)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                        <path d="M12 2L8 6l4 4 4-4-4-4z" fill="url(#rocketGradient)"/>
                        <path d="M12 6L9 9l3 3 3-3-3-3z" fill="url(#rocketGradient)"/>
                      </svg>
                      <span>i.Lab</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-zinc-100 rounded transition-colors" title="New chat">
                      <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setIsAnimating(true)
                        setChatOpen(false)
                        setTimeout(() => setIsAnimating(false), 500)
                      }}
                      className="p-1.5 hover:bg-zinc-100 rounded transition-colors"
                      title="Minimize chat"
                    >
                      <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <div className="ml-1.5 w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-black">fOS</span>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {messages.length === 0 ? (
                    // Initial State: Welcome Message and Recommendations
                    <div className="flex-1 flex flex-col items-start justify-start pt-5 px-6 pb-5">
                      <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center mb-3">
                        <span className="text-sm font-medium text-black">fOS</span>
                      </div>
                      <h2 className="text-xl font-semibold text-black mb-2 text-left">What do you need?</h2>
                      
                      {/* Recommended Tasks */}
                      <div className="w-full space-y-3 mb-8 max-w-lg">
                        {proactiveActions.slice(0, 3).map((action) => {
                          return (
                            <button
                              key={action.id}
                              onClick={() => executeAction(action.action)}
                              disabled={loading}
                              className="w-full text-left px-4 py-3.5 hover:bg-zinc-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group bg-white"
                            >
                              <div className="text-sm font-semibold text-black mb-1">{action.title}</div>
                              <div className="text-xs text-zinc-600 leading-relaxed">{action.description}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    // Messages View
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                      {messages.map((message, index) => {
                        // Format AI assistant messages with rich text
                        const formatMessage = (content: string): React.ReactNode[] => {
                          const lines = content.split('\n')
                          const elements: React.ReactNode[] = []
                          let currentParagraph: string[] = []
                          let listItems: string[] = []
                          let inList = false
                          let elementKey = 0

                          const parseInlineMarkdown = (text: string): React.ReactNode[] => {
                            // Split by markdown patterns: bold, links
                            const parts = text.split(/(\*\*.*?\*\*|__.*?__|\[.*?\]\(.*?\))/g)
                            const nodes: React.ReactNode[] = []
                            
                            parts.forEach((part, idx) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                nodes.push(<strong key={idx} className="font-semibold">{part.slice(2, -2)}</strong>)
                              } else if (part.startsWith('__') && part.endsWith('__')) {
                                nodes.push(<strong key={idx} className="font-semibold">{part.slice(2, -2)}</strong>)
                              } else if (part.match(/^\[.*?\]\(.*?\)$/)) {
                                // Markdown link: [text](url)
                                const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
                                if (linkMatch) {
                                  const [, linkText, linkUrl] = linkMatch
                                  nodes.push(
                                    <a 
                                      key={idx} 
                                      href={linkUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      {linkText}
                                    </a>
                                  )
                                } else {
                                  nodes.push(<span key={idx}>{part}</span>)
                                }
                              } else if (part) {
                                nodes.push(<span key={idx}>{part}</span>)
                              }
                            })
                            
                            return nodes
                          }

                          const flushParagraph = () => {
                            if (currentParagraph.length > 0) {
                              const text = currentParagraph.join(' ')
                              elements.push(
                                <p key={`p-${elementKey++}`} className="mb-4 text-[15px] leading-relaxed text-black">
                                  {parseInlineMarkdown(text)}
                                </p>
                              )
                              currentParagraph = []
                            }
                          }

                          const flushList = () => {
                            if (listItems.length > 0) {
                              elements.push(
                                <ul key={`ul-${elementKey++}`} className="mb-4 space-y-2 list-none">
                                  {listItems.map((item, idx) => {
                                    const cleanItem = item.replace(/^[-*•]\s+/, '').trim()
                                    return (
                                      <li key={idx} className="flex items-start gap-2 text-[15px] text-black">
                                        <span className="text-zinc-400 mt-1.5 flex-shrink-0">•</span>
                                        <span className="leading-relaxed">
                                          {parseInlineMarkdown(cleanItem)}
                                        </span>
                                      </li>
                                    )
                                  })}
                                </ul>
                              )
                              listItems = []
                              inList = false
                            }
                          }

                          lines.forEach((line, lineIdx) => {
                            const trimmed = line.trim()

                            if (trimmed.startsWith('### ')) {
                              flushParagraph()
                              flushList()
                              const headerText = trimmed.slice(4)
                              elements.push(
                                <h3 key={`h3-${elementKey++}`} className="mb-3 mt-6 text-base font-semibold text-black first:mt-0">
                                  {parseInlineMarkdown(headerText)}
                                </h3>
                              )
                            } else if (trimmed.startsWith('## ')) {
                              flushParagraph()
                              flushList()
                              const headerText = trimmed.slice(3)
                              elements.push(
                                <h2 key={`h2-${elementKey++}`} className="mb-4 mt-8 text-xl font-bold text-black first:mt-0">
                                  {parseInlineMarkdown(headerText)}
                                </h2>
                              )
                            } else if (trimmed.match(/^[-*•]\s+/)) {
                              flushParagraph()
                              inList = true
                              listItems.push(trimmed)
                            } else if (trimmed === '') {
                              flushParagraph()
                              flushList()
                            } else {
                              if (inList) {
                                flushList()
                              }
                              currentParagraph.push(trimmed)
                            }
                          })

                          flushParagraph()
                          flushList()

                          return elements.length > 0 ? elements : [<span key="empty">{content}</span>]
                        }

                        return (
                          <div key={index}>
                            {message.role === 'user' ? (
                              <div className="flex justify-center mb-4">
                                <div className="px-3 py-2 rounded-lg bg-zinc-100 text-sm text-zinc-600">
                                  {message.content}
                                </div>
                              </div>
                            ) : (
                              <div className="text-black">
                                {formatMessage(message.content)}
                              </div>
                            )}

                            {message.actions && message.actions.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {message.actions.map((action, actionIndex) => (
                                  <button
                                    key={actionIndex}
                                    onClick={() => executeAction(action)}
                                    disabled={loading}
                                    className="w-full text-left px-3 py-2 border border-zinc-300 rounded hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <div className="text-xs font-medium text-black">{action.title}</div>
                                    <div className="text-[10px] text-zinc-600 mt-0.5">{action.details}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="bg-zinc-100 px-3 py-2 rounded-lg text-sm text-black">
                            <span className="inline-block animate-pulse">Thinking...</span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="px-4 py-3 bg-white">
                  <form onSubmit={handleSubmit} className="relative">
                    <div className="relative flex items-center gap-2">
                      <div className="relative" ref={attachMenuRef}>
                        <button
                          type="button"
                          onClick={() => setShowAttachMenu(!showAttachMenu)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        {showAttachMenu && (
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap z-10 opacity-0 animate-[fadeIn_0.2s_ease-out_forwards]">
                            Add images or PDFs
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-800 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      <div className="flex-1 relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={input}
                          onChange={(e) => {
                            const value = e.target.value
                            const cursorPosition = e.target.selectionStart || 0
                            
                            // Check if we're typing after "@"
                            const textBeforeCursor = value.substring(0, cursorPosition)
                            const lastAtIndex = textBeforeCursor.lastIndexOf('@')
                            
                            if (lastAtIndex !== -1) {
                              const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
                              // Check if there's no space between @ and cursor
                              if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
                                setMentionMode({
                                  active: true,
                                  query: textAfterAt.toLowerCase(),
                                  startIndex: lastAtIndex,
                                  cursorPosition: cursorPosition
                                })
                                setSelectedMentionIndex(0)
                              } else {
                                setMentionMode({ active: false, query: '', startIndex: 0, cursorPosition: 0 })
                              }
                            } else {
                              setMentionMode({ active: false, query: '', startIndex: 0, cursorPosition: 0 })
                            }
                            
                            setInput(value)
                          }}
                          onKeyDown={(e) => {
                            if (mentionMode.active) {
                              const filteredContacts = contacts.filter(c =>
                                c.name.toLowerCase().includes(mentionMode.query)
                              )
                              
                              if (e.key === 'ArrowDown') {
                                e.preventDefault()
                                setSelectedMentionIndex(prev => 
                                  prev < filteredContacts.length - 1 ? prev + 1 : prev
                                )
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault()
                                setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : 0)
                              } else if (e.key === 'Enter' && filteredContacts.length > 0) {
                                e.preventDefault()
                                const selectedContact = filteredContacts[selectedMentionIndex]
                                const beforeMention = input.substring(0, mentionMode.startIndex)
                                const afterMention = input.substring(mentionMode.cursorPosition)
                                const newValue = `${beforeMention}@${selectedContact.name} ${afterMention}`
                                setInput(newValue)
                                setMentionMode({ active: false, query: '', startIndex: 0, cursorPosition: 0 })
                                setSelectedMentionIndex(0)
                                // Set cursor position after the mention
                                setTimeout(() => {
                                  if (inputRef.current) {
                                    const cursorPos = beforeMention.length + selectedContact.name.length + 2
                                    inputRef.current.setSelectionRange(cursorPos, cursorPos)
                                    inputRef.current.focus()
                                  }
                                }, 0)
                              } else if (e.key === 'Escape') {
                                setMentionMode({ active: false, query: '', startIndex: 0, cursorPosition: 0 })
                              }
                            }
                          }}
                          placeholder="Do anything with AI... (type @ to mention a contact)"
                          disabled={loading}
                          className="w-full px-2 py-2.5 text-sm border-0 focus:outline-none disabled:bg-transparent placeholder:text-zinc-400 bg-transparent"
                          onFocus={() => setShowAttachMenu(false)}
                        />
                        
                        {/* Mention Dropdown */}
                        {mentionMode.active && (
                          <div className="mention-dropdown absolute bottom-full left-0 mb-2 w-64 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                            {contacts
                              .filter(c => c.name.toLowerCase().includes(mentionMode.query))
                              .slice(0, 5)
                              .map((contact, index) => (
                                <button
                                  key={contact.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    const beforeMention = input.substring(0, mentionMode.startIndex)
                                    const afterMention = input.substring(mentionMode.cursorPosition)
                                    const newValue = `${beforeMention}@${contact.name} ${afterMention}`
                                    setInput(newValue)
                                    setMentionMode({ active: false, query: '', startIndex: 0, cursorPosition: 0 })
                                    setSelectedMentionIndex(0)
                                    // Set cursor position after the mention
                                    setTimeout(() => {
                                      if (inputRef.current) {
                                        const cursorPos = beforeMention.length + contact.name.length + 2
                                        inputRef.current.setSelectionRange(cursorPos, cursorPos)
                                        inputRef.current.focus()
                                      }
                                    }, 0)
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 transition-colors ${
                                    index === selectedMentionIndex ? 'bg-zinc-100' : ''
                                  }`}
                                >
                                  <div className="font-medium text-black">{contact.name}</div>
                                  {(contact.email || contact.company || contact.position) && (
                                    <div className="text-xs text-zinc-500 mt-0.5">
                                      {contact.position && contact.company 
                                        ? `${contact.position} at ${contact.company}`
                                        : contact.position || contact.company || contact.email}
                                    </div>
                                  )}
                                </button>
                              ))}
                            {contacts.filter(c => c.name.toLowerCase().includes(mentionMode.query)).length === 0 && (
                              <div className="px-3 py-2 text-sm text-zinc-500">
                                No contacts found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Auto</span>
                        <button
                          type="submit"
                          disabled={loading || !input.trim()}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Missing Integration Modal */}
      {missingIntegrationModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-black mb-4">
              Connect Integrations Required
            </h3>
            <p className="text-zinc-600 mb-4">
              To complete <strong>"{missingIntegrationModal.taskTitle}"</strong>, you need to connect the following integrations:
            </p>
            <ul className="list-disc list-inside mb-6 space-y-2">
              {missingIntegrationModal.missingIntegrations.map((integration) => {
                const integrationNames: Record<string, string> = {
                  'google_calendar': 'Google Calendar',
                  'gmail': 'Gmail',
                  'google_docs': 'Google Docs',
                  'google': 'Google'
                }
                return (
                  <li key={integration} className="text-zinc-700">
                    {integrationNames[integration] || integration}
                  </li>
                )
              })}
            </ul>
            <div className="flex gap-3">
              <Link
                href="/integrations"
                className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors text-center"
                onClick={() => setMissingIntegrationModal({ show: false, missingIntegrations: [], taskTitle: '' })}
              >
                Go to Integrations
              </Link>
              <button
                onClick={() => setMissingIntegrationModal({ show: false, missingIntegrations: [], taskTitle: '' })}
                className="flex-1 border border-zinc-300 text-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
