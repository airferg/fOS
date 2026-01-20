'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ApprovalModal from '@/components/ApprovalModal'
import IntegrationActivityFeed from '@/components/IntegrationActivityFeed'
import ThemeToggle from '@/components/ThemeToggle'
import EditNorthStarModal from '@/components/EditNorthStarModal'

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

// Function badge utility
const getFunctionBadge = (functionContext?: string) => {
  if (!functionContext) return null
  
  const configs: Record<string, { label: string; bg: string; text: string }> = {
    product: { label: 'Product', bg: 'bg-blue-100', text: 'text-blue-700' },
    marketing: { label: 'Marketing', bg: 'bg-purple-100', text: 'text-purple-700' },
    finance: { label: 'Finance', bg: 'bg-green-100', text: 'text-green-700' },
    sales: { label: 'Sales', bg: 'bg-orange-100', text: 'text-orange-700' },
    operations: { label: 'Ops', bg: 'bg-zinc-100', text: 'text-zinc-700' },
    legal: { label: 'Legal', bg: 'bg-red-100', text: 'text-red-700' },
    team: { label: 'Team', bg: 'bg-cyan-100', text: 'text-cyan-700' },
    analytics: { label: 'Analytics', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  }
  
  const config = configs[functionContext]
  if (!config) return null
  
  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [connectedIntegrations, setConnectedIntegrations] = useState<Record<string, boolean>>({})
  const [chatOpen, setChatOpen] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([])
  const [proactiveActions, setProactiveActions] = useState<ProactiveAction[]>([])
  const [strategicRecommendations, setStrategicRecommendations] = useState<any[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [selectedFunctionFilter, setSelectedFunctionFilter] = useState<string>('all') // 'all' | 'product' | 'marketing' | etc.
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
  
  // Approval system state
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [loadingApprovals, setLoadingApprovals] = useState(false)
  
  // Integration activity feed state
  const [showActivityFeed, setShowActivityFeed] = useState(false)
  const [integrationActivity, setIntegrationActivity] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  
  // North Star edit modal state
  const [showEditNorthStar, setShowEditNorthStar] = useState(false)

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
        loadConnectedIntegrations()
        loadPendingApprovals()
        loadIntegrationActivity()
        // Load proactive actions after a small delay to ensure auth is fully settled
        setTimeout(() => {
          loadProactiveActions()
          loadStrategicRecommendations()
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
        
        // Build input for agent - if data is empty, use action title as task
        let agentInput = action.data?.input || action.data || {}
        
        // For task-executor agent, if no task is provided, use the action title
        if (agentId === 'task-executor' && (!agentInput.task && !agentInput.context?.task)) {
          agentInput = {
            task: action.title || action.data?.task || 'Complete the requested task',
            context: action.data?.context || {}
          }
        }
        
        const res = await fetch('/api/agents/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            agentId,
            input: agentInput
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

        // Check if action requires approval
        if (result.success && result.data?.requiresApproval) {
          // Action requires approval - load pending approvals and show modal
          console.log('[Dashboard] ⚠️ Action requires approval:', result.data.approvalId)
          await loadPendingApprovals()
          
          // Find the approval that was just created
          if (result.data.approvalId) {
            const approvalRes = await fetch(`/api/approvals/${result.data.approvalId}`, { credentials: 'include' })
            if (approvalRes.ok) {
              const approvalData = await approvalRes.json()
              if (approvalData.approval) {
                setSelectedApproval(approvalData.approval)
                setShowApprovalModal(true)
              }
            }
          }
          
          // Update task status to pending approval
          setAgentTasks((prev) => 
            prev.map((task) => 
              task.id === tempTaskId
                ? { ...task, status: 'running' as const, output: { ...result.data, waitingForApproval: true } }
                : task
            )
          )
          
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `⚠️ **Action requires approval**\n\n${result.data.message || 'Please review and approve this action before it executes.'}` },
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

  const loadConnectedIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations/status', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setConnectedIntegrations(data.status || {})
      }
    } catch (error) {
      console.error('Error loading connected integrations:', error)
    }
  }

  const loadPendingApprovals = async () => {
    try {
      setLoadingApprovals(true)
      const res = await fetch('/api/approvals?status=pending', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setPendingApprovals(data.approvals || [])
        // If there are pending approvals, show the modal for the first one
        if (data.approvals && data.approvals.length > 0 && !selectedApproval) {
          setSelectedApproval(data.approvals[0])
          setShowApprovalModal(true)
        }
      }
    } catch (error) {
      console.error('Error loading pending approvals:', error)
    } finally {
      setLoadingApprovals(false)
    }
  }

  const loadIntegrationActivity = async () => {
    try {
      setLoadingActivity(true)
      const res = await fetch('/api/integrations/activity?limit=10', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setIntegrationActivity(data.activity || [])
      }
    } catch (error) {
      console.error('Error loading integration activity:', error)
    } finally {
      setLoadingActivity(false)
    }
  }

  const handleApprove = async (approvalId: string, modifiedData?: any) => {
    try {
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: modifiedData ? 'modified' : 'approved',
          modified_data: modifiedData,
        }),
        credentials: 'include',
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to approve' }))
        throw new Error(error.error || 'Failed to approve')
      }

      const data = await res.json()
      
      // If the action should be executed, do it now
      if (data.executeAction && data.actionData) {
        // Execute the action using the task executor
        const actionToExecute = data.actionData
        if (actionToExecute.tool === 'send_email' && actionToExecute.params) {
          // Re-execute the email send with the approved/modified data
          const taskRes = await fetch('/api/agents/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId: 'task-executor',
              input: {
                task: `Send email: ${actionToExecute.params.subject}`,
                skipApproval: true, // Skip approval since we already approved
                ...actionToExecute.params,
              },
            }),
            credentials: 'include',
          })

          if (taskRes.ok) {
            const taskData = await taskRes.json()
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: `✓ Email sent successfully!` },
            ])
            setChatOpen(true)
            loadAgentTasks()
          }
        }
      }

      // Reload approvals and remove this one
      await loadPendingApprovals()
      if (selectedApproval?.id === approvalId) {
        setSelectedApproval(null)
        setShowApprovalModal(false)
      }
    } catch (error: any) {
      console.error('Error approving:', error)
      alert(`Failed to approve: ${error.message}`)
    }
  }

  const handleReject = async (approvalId: string, reason?: string) => {
    try {
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: reason,
        }),
        credentials: 'include',
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to reject' }))
        throw new Error(error.error || 'Failed to reject')
      }

      // Update agent task if linked
      await loadAgentTasks()
      
      // Reload approvals and remove this one
      await loadPendingApprovals()
      if (selectedApproval?.id === approvalId) {
        setSelectedApproval(null)
        setShowApprovalModal(false)
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Action rejected. ${reason ? `Reason: ${reason}` : ''}` },
      ])
      setChatOpen(true)
    } catch (error: any) {
      console.error('Error rejecting:', error)
      alert(`Failed to reject: ${error.message}`)
    }
  }

  const handleSaveNorthStar = async (buildingDescription: string, currentGoal: string) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building_description: buildingDescription || null,
          current_goal: currentGoal || null,
        }),
        credentials: 'include',
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to update North Star' }))
        throw new Error(error.error || 'Failed to update North Star')
      }

      const updatedProfile = await res.json()
      setProfile(updatedProfile)
      
      // Refresh recommendations since they depend on the North Star
      loadStrategicRecommendations()
      
      return updatedProfile
    } catch (error: any) {
      console.error('Error saving North Star:', error)
      throw error
    }
  }

  const loadStrategicRecommendations = async () => {
    try {
      setLoadingRecommendations(true)
      console.log('[Dashboard] Loading strategic recommendations...')
      const res = await fetch('/api/recommendations', { credentials: 'include' })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('[Dashboard] Recommendations API error:', res.status, errorData)
        setStrategicRecommendations([])
        return
      }
      
      const data = await res.json()
      console.log('[Dashboard] Received recommendations:', data.count || 0, 'recommendations')
      
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setStrategicRecommendations(data.recommendations)
        console.log('[Dashboard] Set', data.recommendations.length, 'recommendations')
      } else {
        console.warn('[Dashboard] No recommendations array in response:', data)
        setStrategicRecommendations([])
      }
    } catch (error: any) {
      console.error('[Dashboard] Error loading strategic recommendations:', error)
      console.error('[Dashboard] Error details:', error.message, error.stack)
      setStrategicRecommendations([])
    } finally {
      setLoadingRecommendations(false)
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-zinc-950 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 dark:border-zinc-800">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <img src="/fOS.png" alt="fOS" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-black dark:text-white dark:text-black dark:text-white dark:text-black font-medium">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:hover:text-white dark:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors">
              Roadmap
            </Link>
            <Link href="/contacts" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:hover:text-white dark:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors">
              Network
            </Link>
            <Link href="/documents" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:hover:text-white dark:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors">
              Documents
            </Link>
            <Link href="/agents" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:hover:text-white dark:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors">
              AI Agents
            </Link>
            <Link href="/integrations" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:hover:text-white dark:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors">
              Integrations
            </Link>
            <Link href="/dev" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:hover:text-white dark:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors">
              Dev
            </Link>
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:hover:text-white dark:text-black dark:text-white dark:text-black dark:hover:text-white dark:text-black transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Metrics */}
        <div className="w-80 bg-white dark:bg-zinc-950 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 p-6 overflow-y-auto">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mb-4">
            Your Resources
          </h2>

          <div className="space-y-4">
            {/* Time Availability Card */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 dark:bg-zinc-900 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-400">Time Available</span>
                <span className="text-2xl">⏰</span>
              </div>
              <div className="text-2xl font-bold text-black dark:text-white dark:text-black dark:text-white dark:text-black">
                {profile?.hours_per_week || 0}
                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 dark:text-zinc-400"> hrs/week</span>
              </div>
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-400">
                ~{Math.round((profile?.hours_per_week || 0) / 7)} hrs/day
              </div>
            </div>

            {/* Budget Card */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 dark:bg-zinc-900 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-400">Budget</span>
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-2xl font-bold text-black dark:text-white dark:text-black dark:text-white dark:text-black">
                ${(profile?.funds_available || 0).toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-400">
                Available funds
              </div>
            </div>

            {/* Team Card */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 dark:bg-zinc-900 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-400">Team</span>
                <span className="text-2xl">👥</span>
              </div>
              <div className="text-2xl font-bold text-black dark:text-white dark:text-black dark:text-white dark:text-black">
                {profile?.team_size || 1}
              </div>
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-400">
                {profile?.team_size === 1 ? 'Solo founder' : 'Team members'}
              </div>
            </div>

            {/* Connections Preview Card */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 dark:bg-zinc-900 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-400">Network</span>
                <span className="text-2xl">🌐</span>
              </div>
              <div className="text-2xl font-bold text-black dark:text-white dark:text-black dark:text-white dark:text-black">
                24
              </div>
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-400">
                Active connections
              </div>
              <Link
                href="/contacts"
                className="mt-2 text-xs text-black dark:text-white dark:text-black dark:text-white dark:text-black hover:underline inline-block"
              >
                View all →
              </Link>
            </div>

            {/* Roadmap Preview Card */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 dark:bg-zinc-900 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-400">Roadmap</span>
                <span className="text-2xl">🗺️</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400">Todo</span>
                  <span className="font-medium text-black dark:text-white dark:text-black dark:text-white dark:text-black">{upcomingTasks.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400">In Progress</span>
                  <span className="font-medium text-black dark:text-white dark:text-black dark:text-white dark:text-black">{inProgressTasks.length}</span>
                </div>
              </div>
              <Link
                href="/roadmap"
                className="mt-2 text-xs text-black dark:text-white dark:text-black dark:text-white dark:text-black hover:underline inline-block"
              >
                View roadmap →
              </Link>
            </div>

            {/* Connected Integrations - Individual Cards */}
            {(() => {
              const connected = Object.entries(connectedIntegrations).filter(([_, isConnected]) => isConnected)
              const integrationNames: Record<string, string> = {
                'gmail': 'Gmail',
                'google-calendar': 'Google Calendar',
                'google_calendar': 'Google Calendar',
                'google-docs': 'Google Docs',
                'google_docs': 'Google Docs',
                'outlook': 'Outlook',
                'slack': 'Slack',
                'discord': 'Discord',
                'zoom': 'Zoom',
                'calendly': 'Calendly',
                'notion': 'Notion',
                'airtable': 'Airtable',
                'coda': 'Coda',
                'tally': 'Tally',
                'typeform': 'Typeform',
                'google-forms': 'Google Forms',
                'google_forms': 'Google Forms',
                'productboard': 'ProductBoard',
                'linear': 'Linear',
                'jira': 'Jira',
                'asana': 'Asana',
                'github': 'GitHub',
                'gitlab': 'GitLab',
                'vercel': 'Vercel',
                'linkedin': 'LinkedIn',
                'twitter': 'Twitter/X',
                'google-analytics': 'Google Analytics',
                'google_analytics': 'Google Analytics',
                'stripe': 'Stripe',
                'quickbooks': 'QuickBooks',
                'intercom': 'Intercom',
                'zendesk': 'Zendesk',
                'mailchimp': 'Mailchimp',
                'hubspot': 'HubSpot',
                'mixpanel': 'Mixpanel',
                'amplitude': 'Amplitude',
              }
              
              const integrationIcons: Record<string, string> = {
                'gmail': '📧',
                'google-calendar': '📅',
                'google_calendar': '📅',
                'google-docs': '📄',
                'google_docs': '📄',
                'outlook': '📨',
                'slack': '💬',
                'discord': '🎮',
                'zoom': '🎥',
                'calendly': '🗓️',
                'notion': '📝',
                'airtable': '🗂️',
                'coda': '📋',
                'tally': '📊',
                'typeform': '📝',
                'google-forms': '📋',
                'google_forms': '📋',
                'productboard': '🎯',
                'linear': '⚡',
                'jira': '🔷',
                'asana': '✓',
                'github': '🐙',
                'gitlab': '🦊',
                'vercel': '▲',
                'linkedin': '💼',
                'twitter': '🐦',
                'google-analytics': '📈',
                'google_analytics': '📈',
                'stripe': '💳',
                'quickbooks': '💰',
                'intercom': '💬',
                'zendesk': '🎫',
                'mailchimp': '🐵',
                'hubspot': '🧲',
                'mixpanel': '📊',
                'amplitude': '📉',
              }
              
              return connected.length > 0 ? (
                <>
                  {connected.slice(0, 5).map(([id, _]) => (
                    <div key={id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{integrationNames[id] || id}</span>
                        <span className="text-2xl">{integrationIcons[id] || '🔌'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Connected</span>
                      </div>
                    </div>
                  ))}
                  {connected.length > 5 && (
                    <Link
                      href="/integrations"
                      className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 hover:bg-zinc-100 hover:shadow-sm transition-all text-center"
                    >
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        +{connected.length - 5} more
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Manage integrations →
                      </div>
                    </Link>
                  )}
                  {connected.length <= 5 && (
                    <Link
                      href="/integrations"
                      className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 hover:bg-zinc-100 hover:shadow-sm transition-all text-center"
                    >
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Manage integrations →
                      </div>
                    </Link>
                  )}
                </>
              ) : null
            })()}

            {/* Current Goal Card */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">Current Goal</div>
              <div className="text-sm text-black dark:text-white dark:text-black font-medium mb-3">
                {profile?.current_goal || 'Loading...'}
              </div>
              <button
                onClick={async () => {
                  setLoading(true)
                  try {
                    const res = await fetch('/api/strategic/plan', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({})
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setMessages((prev) => [
                        ...prev,
                        { 
                          role: 'assistant', 
                          content: `🎯 **Strategic Plan Generated!**\n\n${JSON.stringify(data.plan, null, 2).substring(0, 500)}...\n\nView full plan in Roadmap.`
                        }
                      ])
                      setChatOpen(true)
                      loadData() // Refresh roadmap
                      loadStrategicRecommendations()
                    }
                  } catch (error: any) {
                    console.error('Error generating strategic plan:', error)
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full px-3 py-2 bg-black dark:bg-white dark:bg-zinc-950 text-white dark:text-black text-xs font-medium rounded hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Strategic Plan
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* North Star - What User Is Building */}
          {(profile?.building_description || profile?.current_goal) && (
            <div className="bg-gradient-to-br from-black to-zinc-900 dark:from-white dark:to-zinc-100 border-b border-zinc-800 dark:border-zinc-200 p-6 text-white dark:text-black relative group">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Your North Star</div>
                  <button
                    onClick={() => setShowEditNorthStar(true)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 dark:hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit North Star"
                  >
                    <svg className="w-4 h-4 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                {profile?.building_description_summary && (
                  <div className="text-xl font-bold mb-2">
                    BUILDING: {profile.building_description_summary.toUpperCase()}
                  </div>
                )}
                {profile?.current_goal_summary && (
                  <div className="text-lg font-semibold text-zinc-300 dark:text-zinc-700">
                    GOAL: {profile.current_goal_summary}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strategic Recommendations Section */}
          {strategicRecommendations.length > 0 && (
            <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-black dark:text-white dark:text-black">Strategic Recommendations</h2>
                <div className="flex items-center gap-2">
                  {/* Function Filter Toggle */}
                  <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setSelectedFunctionFilter('all')}
                      className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                        selectedFunctionFilter === 'all'
                          ? 'bg-white dark:bg-zinc-950 text-black dark:text-white dark:text-black shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white dark:text-black dark:text-white dark:text-black'
                      }`}
                    >
                      All
                    </button>
                    {['product', 'marketing', 'finance', 'sales', 'operations', 'legal', 'team', 'analytics'].map((func) => (
                      <button
                        key={func}
                        onClick={() => setSelectedFunctionFilter(func)}
                        className={`px-2 py-1 text-[10px] font-medium rounded transition-colors capitalize ${
                          selectedFunctionFilter === func
                            ? 'bg-white dark:bg-zinc-950 text-black dark:text-white dark:text-black shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white dark:text-black dark:text-white dark:text-black'
                        }`}
                      >
                        {func === 'operations' ? 'Ops' : func}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={loadStrategicRecommendations}
                    disabled={loadingRecommendations}
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white dark:text-black dark:text-white dark:text-black transition-colors disabled:opacity-50"
                  >
                    {loadingRecommendations ? '...' : 'Refresh'}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {strategicRecommendations
                  .filter((rec) => selectedFunctionFilter === 'all' || rec.functionContext === selectedFunctionFilter)
                  .slice(0, selectedFunctionFilter === 'all' ? 6 : 12)
                  .map((rec) => (
                  <div
                    key={rec.id}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${
                      rec.canDoAgentically
                        ? 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {rec.canDoAgentically && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-black dark:bg-white dark:bg-zinc-950 text-white dark:text-black">
                          AI
                        </span>
                      )}
                      {getFunctionBadge(rec.functionContext)}
                    </div>
                    <span className="text-xs font-medium text-black dark:text-white dark:text-black flex-1 max-w-[200px] truncate">
                      {rec.title}
                    </span>
                    {rec.action && rec.canDoAgentically ? (
                      <button
                        onClick={async () => {
                          // Add to roadmap first, then execute
                          try {
                            const roadmapRes = await fetch('/api/roadmap', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                            body: JSON.stringify({
                              title: rec.title,
                              description: rec.description.substring(0, 200),
                              status: 'todo',
                              priority: rec.priority === 'high' ? 10 : rec.priority === 'medium' ? 5 : 0,
                              function_context: rec.functionContext || null,
                            }),
                            })
                            if (roadmapRes.ok) {
                              loadData() // Refresh roadmap
                            }
                          } catch (e) {
                            console.error('Error adding to roadmap:', e)
                          }
                          executeAction(rec.action)
                        }}
                        disabled={loading}
                        className="px-2 py-1 bg-black dark:bg-white dark:bg-zinc-950 text-white dark:text-black text-[10px] font-medium rounded hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Do it
                      </button>
                    ) : (
                        <button
                          onClick={async () => {
                            // Add to roadmap for manual tasks, then mark recommendation as added
                            try {
                              const roadmapRes = await fetch('/api/roadmap', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                            body: JSON.stringify({
                              title: rec.title,
                              description: rec.description.substring(0, 200),
                              status: 'todo',
                              priority: rec.priority === 'high' ? 10 : rec.priority === 'medium' ? 5 : 0,
                              function_context: rec.functionContext || null,
                            }),
                              })
                              if (roadmapRes.ok) {
                                const roadmapData = await roadmapRes.json()
                                loadData() // Refresh roadmap
                                
                                // Mark recommendation as added to roadmap
                                if (rec.id) {
                                  try {
                                    await fetch(`/api/recommendations/${rec.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({
                                        status: 'added_to_roadmap',
                                        related_roadmap_item_id: roadmapData.item?.id
                                      }),
                                    })
                                  } catch (e) {
                                    console.error('Error updating recommendation status:', e)
                                  }
                                }
                                
                                // Remove from recommendations
                                setStrategicRecommendations(strategicRecommendations.filter(r => r.id !== rec.id))
                              }
                            } catch (e) {
                              console.error('Error adding to roadmap:', e)
                            }
                          }}
                          className="px-2 py-1 border border-zinc-300 text-zinc-600 dark:text-zinc-400 text-[10px] font-medium rounded hover:bg-zinc-50 transition-colors whitespace-nowrap"
                        >
                          Add
                        </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Suggestions - Top Prioritized Recommendations */}
          <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-black dark:text-white dark:text-black">Today's Suggestions</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{today}</p>
              </div>
            </div>
            
            {/* Show top recommendations if available, otherwise show proactive actions */}
            {(strategicRecommendations.length > 0 || proactiveActions.length > 0) && (
              <div className="space-y-2">
                {/* Prioritize recommendations over proactive actions */}
                {(strategicRecommendations.length > 0 
                  ? strategicRecommendations.filter((rec: any) => selectedFunctionFilter === 'all' || rec.functionContext === selectedFunctionFilter)
                  : proactiveActions).slice(0, 3).map((action) => {
                  const isRecommendation = strategicRecommendations.length > 0 && strategicRecommendations.includes(action as any)
                  const rec = isRecommendation ? action as any : null
                  const proactiveAction = !isRecommendation ? action as ProactiveAction : null
                  
                  return (
                    <div
                      key={rec?.id || proactiveAction?.id}
                      className={`flex items-center justify-between px-3 py-2 border rounded-lg hover:shadow-sm transition-all ${
                        rec?.canDoAgentically 
                          ? 'border-zinc-300 bg-zinc-50' 
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {rec?.canDoAgentically && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-black dark:bg-white dark:bg-zinc-950 text-white dark:text-black flex-shrink-0">
                            AI
                          </span>
                        )}
                        {rec && getFunctionBadge(rec.functionContext)}
                        {proactiveAction?.icon && (
                          <span className="text-lg flex-shrink-0">{proactiveAction.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-black dark:text-white dark:text-black truncate">
                            {rec?.title || proactiveAction?.title}
                          </div>
                        </div>
                      </div>
                      {rec?.action && rec.canDoAgentically && (
                        <button
                          onClick={async () => {
                            // Add to roadmap first, then execute, then mark recommendation as added
                            try {
                              const roadmapRes = await fetch('/api/roadmap', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                  body: JSON.stringify({
                                    title: rec.title,
                                    description: rec.description?.substring(0, 200) || '',
                                    status: 'todo',
                                    priority: rec.priority === 'high' ? 10 : rec.priority === 'medium' ? 5 : 0,
                                    function_context: rec.functionContext || null,
                                  }),
                              })
                              if (roadmapRes.ok) {
                                const roadmapData = await roadmapRes.json()
                                loadData() // Refresh roadmap
                                
                                // Mark recommendation as added to roadmap
                                if (rec.id) {
                                  try {
                                    await fetch(`/api/recommendations/${rec.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({
                                        status: 'added_to_roadmap',
                                        related_roadmap_item_id: roadmapData.item?.id
                                      }),
                                    })
                                    // Remove from UI
                                    setStrategicRecommendations(strategicRecommendations.filter(r => r.id !== rec.id))
                                  } catch (e) {
                                    console.error('Error updating recommendation status:', e)
                                  }
                                }
                              }
                            } catch (e) {
                              console.error('Error adding to roadmap:', e)
                            }
                            executeAction(rec.action)
                          }}
                          disabled={loading}
                          className="px-2 py-1 bg-black dark:bg-white dark:bg-zinc-950 text-white dark:text-black text-[10px] font-medium rounded hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ml-2"
                        >
                          Do it
                        </button>
                      )}
                      {proactiveAction?.action && (
                        <button
                          onClick={() => executeAction(proactiveAction.action)}
                          disabled={loading}
                          className="px-2 py-1 bg-black dark:bg-white dark:bg-zinc-950 text-white dark:text-black text-[10px] font-medium rounded hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ml-2"
                        >
                          Execute
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Live Timeline */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-base font-semibold text-black dark:text-white dark:text-black mb-4">Activity Timeline</h3>
              <div className="space-y-0 relative">
                {agentTasks.length > 0 ? (
                  agentTasks.map((task, index) => {
                    const isLast = index === agentTasks.length - 1
                    const statusConfig = {
                      pending: { label: 'Initialized', color: 'text-zinc-600 dark:text-zinc-400', icon: null },
                      running: { label: 'Running', color: 'text-black dark:text-white dark:text-black', icon: 'animate-spin' },
                      completed: { label: 'Completed', color: 'text-zinc-600 dark:text-zinc-400', icon: '✓' },
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
                            task.status === 'completed' ? 'bg-black dark:bg-white dark:bg-zinc-950 border-black' :
                            task.status === 'failed' ? 'bg-red-500 border-red-500' :
                            task.status === 'running' ? 'bg-black dark:bg-white dark:bg-zinc-950 border-black animate-pulse' :
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
                                <span className="text-sm font-semibold text-black dark:text-white dark:text-black">Success:</span>
                              )}
                              <span className={`text-sm font-semibold ${
                                task.status === 'failed' ? 'text-red-500' : 'text-black dark:text-white dark:text-black'
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
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">{formattedDate}</span>
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
                                <div className="flex items-center gap-2 text-sm text-black dark:text-white dark:text-black opacity-0 animate-[fadeIn_0.3s_ease-out_0.3s_forwards]">
                                  <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white dark:bg-zinc-950 animate-pulse flex-shrink-0" />
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
                                    className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 opacity-0 animate-[fadeInSlide_0.3s_ease-out_forwards]"
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
                            <div className="flex items-center gap-2 text-sm text-black dark:text-white dark:text-black mt-3 ml-1 animate-pulse">
                              <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white dark:bg-zinc-950" />
                              <span>Processing...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No recent activity</p>
                    <p className="text-xs text-zinc-400 mt-1">Agent tasks will appear here as they execute</p>
                  </div>
                )}
                <div ref={timelineEndRef} />
              </div>
            </div>
          </div>

          {/* AI Chat - Notion-style Bottom Right */}
          <div
            className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-zinc-950 border border-blue-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ease-out ${
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
                className="w-full h-full flex items-center justify-center relative hover:bg-zinc-50 transition-colors rounded-full bg-white dark:bg-zinc-950"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-black dark:text-white dark:text-black">fOS</span>
                </div>
                {messages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            ) : (
              // Opened State: Full Chat Interface
              <>
                {/* Top Menu Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-3">
                    <button className="px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 rounded-md flex items-center gap-1.5 transition-colors font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-50">
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
                      <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <div className="ml-1.5 w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-black dark:text-white dark:text-black">fOS</span>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {messages.length === 0 ? (
                    // Initial State: Welcome Message and Recommendations
                    <div className="flex-1 flex flex-col items-start justify-start pt-5 px-6 pb-5">
                      <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center mb-3">
                        <span className="text-sm font-medium text-black dark:text-white dark:text-black">fOS</span>
                      </div>
                      <h2 className="text-xl font-semibold text-black dark:text-white dark:text-black mb-2 text-left">What do you need?</h2>
                      
                      {/* Recommended Tasks */}
                      <div className="w-full space-y-3 mb-8 max-w-lg">
                        {proactiveActions.slice(0, 3).map((action) => {
                          return (
                            <button
                              key={action.id}
                              onClick={() => executeAction(action.action)}
                              disabled={loading}
                              className="w-full text-left px-4 py-3.5 hover:bg-zinc-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group bg-white dark:bg-zinc-950"
                            >
                              <div className="text-sm font-semibold text-black dark:text-white dark:text-black mb-1">{action.title}</div>
                              <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{action.description}</div>
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
                                <p key={`p-${elementKey++}`} className="mb-4 text-[15px] leading-relaxed text-black dark:text-white dark:text-black">
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
                                      <li key={idx} className="flex items-start gap-2 text-[15px] text-black dark:text-white dark:text-black">
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
                                <h3 key={`h3-${elementKey++}`} className="mb-3 mt-6 text-base font-semibold text-black dark:text-white dark:text-black first:mt-0">
                                  {parseInlineMarkdown(headerText)}
                                </h3>
                              )
                            } else if (trimmed.startsWith('## ')) {
                              flushParagraph()
                              flushList()
                              const headerText = trimmed.slice(3)
                              elements.push(
                                <h2 key={`h2-${elementKey++}`} className="mb-4 mt-8 text-xl font-bold text-black dark:text-white dark:text-black first:mt-0">
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
                                <div className="px-3 py-2 rounded-lg bg-zinc-100 text-sm text-zinc-600 dark:text-zinc-400">
                                  {message.content}
                                </div>
                              </div>
                            ) : (
                              <div className="text-black dark:text-white dark:text-black">
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
                                    <div className="text-xs font-medium text-black dark:text-white dark:text-black">{action.title}</div>
                                    <div className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5">{action.details}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="bg-zinc-100 px-3 py-2 rounded-lg text-sm text-black dark:text-white dark:text-black">
                            <span className="inline-block animate-pulse">Thinking...</span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="px-4 py-3 bg-white dark:bg-zinc-950">
                  <form onSubmit={handleSubmit} className="relative">
                    <div className="relative flex items-center gap-2">
                      <div className="relative" ref={attachMenuRef}>
                        <button
                          type="button"
                          onClick={() => setShowAttachMenu(!showAttachMenu)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        {showAttachMenu && (
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-black dark:bg-white dark:bg-zinc-950 text-white dark:text-black text-xs rounded shadow-lg whitespace-nowrap z-10 opacity-0 animate-[fadeIn_0.2s_ease-out_forwards]">
                            Add images or PDFs
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="w-6 h-6 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 transition-colors"
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
                          <div className="mention-dropdown absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
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
                                  <div className="font-medium text-black dark:text-white dark:text-black">{contact.name}</div>
                                  {(contact.email || contact.company || contact.position) && (
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                      {contact.position && contact.company 
                                        ? `${contact.position} at ${contact.company}`
                                        : contact.position || contact.company || contact.email}
                                    </div>
                                  )}
                                </button>
                              ))}
                            {contacts.filter(c => c.name.toLowerCase().includes(mentionMode.query)).length === 0 && (
                              <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                                No contacts found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Auto</span>
                        <button
                          type="submit"
                          disabled={loading || !input.trim()}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 text-black dark:text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Approval Modal */}
      {showApprovalModal && selectedApproval && (
        <ApprovalModal
          approval={selectedApproval}
          onClose={() => {
            setShowApprovalModal(false)
            setSelectedApproval(null)
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Integration Activity Feed */}
      <IntegrationActivityFeed
        activity={integrationActivity}
        loading={loadingActivity}
        isOpen={showActivityFeed}
        onClose={() => setShowActivityFeed(false)}
      />

      {/* Edit North Star Modal */}
      {showEditNorthStar && (
        <EditNorthStarModal
          buildingDescription={profile?.building_description || null}
          currentGoal={profile?.current_goal || null}
          onClose={() => setShowEditNorthStar(false)}
          onSave={handleSaveNorthStar}
        />
      )}

      {/* Missing Integration Modal */}
      {missingIntegrationModal.show && (
        <div className="fixed inset-0 bg-black dark:bg-white dark:bg-zinc-950 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-black dark:text-white dark:text-black mb-4">
              Connect Integrations Required
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
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
                className="flex-1 bg-black dark:bg-white dark:bg-zinc-950 text-white dark:text-black px-4 py-2 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors text-center"
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
