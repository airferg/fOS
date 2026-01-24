'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  actions?: Action[]
}

interface Action {
  type: 'email' | 'call' | 'document' | 'survey' | 'schedule' | 'agent_id'
  title: string
  details: string
  data: any
}

interface ProactiveAction {
  id: string
  title: string
  description: string
  icon?: string
  action: Action
}

interface Contact {
  id: string
  name: string
  email: string | null
  company: string | null
  position: string | null
}

export default function AIChatAssistant() {
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [proactiveActions, setProactiveActions] = useState<ProactiveAction[]>([])
  const [mentionMode, setMentionMode] = useState<{ active: boolean; query: string; startIndex: number; cursorPosition: number }>({ active: false, query: '', startIndex: 0, cursorPosition: 0 })
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadContacts()
    loadProactiveActions()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionMode.active && inputRef.current && !inputRef.current.contains(e.target as Node)) {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
      const res = await fetch('/api/chat/proactive', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        // Convert proactive messages to actions
        const actions: ProactiveAction[] = []
        if (data.messages && Array.isArray(data.messages)) {
          for (const msg of data.messages) {
            if (msg.suggestedActions && Array.isArray(msg.suggestedActions)) {
              for (const suggestedAction of msg.suggestedActions) {
                actions.push({
                  id: `${msg.id}-${suggestedAction.title || Math.random()}`,
                  title: suggestedAction.title || 'Suggested Action',
                  description: suggestedAction.description || '',
                  action: suggestedAction
                })
              }
            }
          }
        }
        setProactiveActions(actions)
      }
    } catch (error) {
      console.error('Error loading proactive actions:', error)
    }
  }

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
          throw new Error(`Chat API returned HTML instead of JSON (Status: ${res.status})`)
        }
        data = await res.json()
      } catch (parseError: any) {
        console.error('Failed to parse chat response:', parseError)
        throw new Error(`Failed to parse chat response: ${parseError.message}`)
      }

      if (data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            actions: data.actions || []
          },
        ])
        // Mark message as delivered
        if (data.messageId) {
          fetch('/api/chat/proactive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ messageId: data.messageId, delivered: true })
          }).catch(() => {})
        }
      }

      // Reload proactive actions
      loadProactiveActions()
    } catch (error: any) {
      console.error('Error sending message:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I encountered an error: ${error.message}. Please try again.` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async (action: Action) => {
    setLoading(true)

    try {
      const isAgentAction = action.type === 'agent_id' || !!action.data?.agentId
      
      if (isAgentAction) {
        const agentId = action.type === 'agent_id' 
          ? (action.data?.id || action.data?.agentId || action.data?.agent_id || 'task-executor')
          : (action.data?.agentId || 'task-executor')
        
        let agentInput = action.data?.input || action.data || {}
        
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

        const contentType = res.headers.get('content-type')
        const isJson = contentType && contentType.includes('application/json')
        
        if (!res.ok) {
          const errorData = isJson
            ? await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
            : { error: `HTTP ${res.status}: ${res.statusText}` }
          throw new Error(errorData.error || 'Agent execution failed')
        }

        const result = isJson ? await res.json() : { error: 'Invalid response format' }

        if (result.success) {
          let message = `✓ ${action.title} completed!`
          
          if (result.data?.result) {
            const resultText = result.data.result
            message += resultText.length > 150 ? `\n\n${resultText.substring(0, 150)}...` : `\n\n${resultText}`
          }

          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: message },
          ])
          setChatOpen(true)
        } else {
          throw new Error(result.error || 'Agent execution failed')
        }
      } else {
        // Legacy actions - simplified for now
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Action "${action.title}" is not yet supported in this interface.` },
        ])
      }

      loadProactiveActions()
    } catch (error: any) {
      console.error('Action execution error:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Failed: ${error.message}` },
      ])
      setChatOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const formatMessage = (content: string): React.ReactNode[] => {
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let currentParagraph: string[] = []
    let listItems: string[] = []
    let inList = false
    let elementKey = 0

    const parseInlineMarkdown = (text: string): React.ReactNode[] => {
      const parts = text.split(/(\*\*.*?\*\*|__.*?__|\[.*?\]\(.*?\))/g)
      const nodes: React.ReactNode[] = []
      
      parts.forEach((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          nodes.push(<strong key={idx} className="font-semibold">{part.slice(2, -2)}</strong>)
        } else if (part.startsWith('__') && part.endsWith('__')) {
          nodes.push(<strong key={idx} className="font-semibold">{part.slice(2, -2)}</strong>)
        } else if (part.match(/^\[.*?\]\(.*?\)$/)) {
          const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
          if (linkMatch) {
            const [, linkText, linkUrl] = linkMatch
            nodes.push(
              <a 
                key={idx} 
                href={linkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
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
          <p key={`p-${elementKey++}`} className="mb-4 text-[15px] leading-relaxed text-black dark:text-white">
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
                <li key={idx} className="flex items-start gap-2 text-[15px] text-black dark:text-white">
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

    lines.forEach((line) => {
      const trimmed = line.trim()

      if (trimmed.startsWith('### ')) {
        flushParagraph()
        flushList()
        const headerText = trimmed.slice(4)
        elements.push(
          <h3 key={`h3-${elementKey++}`} className="mb-3 mt-6 text-base font-semibold text-black dark:text-white first:mt-0">
            {parseInlineMarkdown(headerText)}
          </h3>
        )
      } else if (trimmed.startsWith('## ')) {
        flushParagraph()
        flushList()
        const headerText = trimmed.slice(3)
        elements.push(
          <h2 key={`h2-${elementKey++}`} className="mb-4 mt-8 text-xl font-bold text-black dark:text-white first:mt-0">
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
    <div
      className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-zinc-950 border border-blue-200 dark:border-blue-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ease-out ${
        chatOpen
          ? 'w-[30vw] h-[50vh] rounded-xl'
          : 'w-14 h-14 rounded-full'
      }`}
      style={{
        transition: chatOpen
          ? 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), height 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          : 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), height 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {!chatOpen ? (
        <button
          onClick={() => {
            setIsAnimating(true)
            setChatOpen(true)
            setTimeout(() => setIsAnimating(false), 500)
          }}
          className="w-full h-full flex items-center justify-center relative hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors rounded-full bg-white dark:bg-zinc-950"
          aria-label="AI Chat Assistant"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
            <span className="text-xs font-medium text-black dark:text-white">H</span>
          </div>
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
          )}
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <button className="px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md flex items-center gap-1.5 transition-colors font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
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
              <button
                onClick={() => {
                  setIsAnimating(true)
                  setChatOpen(false)
                  setTimeout(() => setIsAnimating(false), 500)
                }}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                title="Minimize chat"
              >
                <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <div className="ml-1.5 w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                <span className="text-[10px] font-medium text-black dark:text-white">H</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-start justify-start pt-5 px-6 pb-5">
                <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <span className="text-sm font-medium text-black dark:text-white">H</span>
                </div>
                <h2 className="text-xl font-semibold text-black dark:text-white mb-2 text-left">What do you need?</h2>
                
                <div className="w-full space-y-3 mb-8 max-w-lg">
                  {proactiveActions.slice(0, 3).map((action) => (
                    <button
                      key={action.id}
                      onClick={() => executeAction(action.action)}
                      disabled={loading}
                      className="w-full text-left px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group bg-white dark:bg-zinc-950"
                    >
                      <div className="text-sm font-semibold text-black dark:text-white mb-1">{action.title}</div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{action.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((message, index) => (
                  <div key={index}>
                    {message.role === 'user' ? (
                      <div className="flex justify-center mb-4">
                        <div className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                    ) : (
                      <div className="text-black dark:text-white">
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
                            className="w-full text-left px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="text-xs font-medium text-black dark:text-white">{action.title}</div>
                            <div className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5">{action.details}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg text-sm text-black dark:text-white">
                      <span className="inline-block animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative flex items-center gap-2">
                <div className="relative" ref={attachMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className="w-6 h-6 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  {showAttachMenu && (
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-black dark:bg-white dark:bg-zinc-900 text-white dark:text-black text-xs rounded shadow-lg whitespace-nowrap z-10">
                      Add images or PDFs
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => {
                      const value = e.target.value
                      const cursorPosition = e.target.selectionStart || 0
                      
                      const textBeforeCursor = value.substring(0, cursorPosition)
                      const lastAtIndex = textBeforeCursor.lastIndexOf('@')
                      
                      if (lastAtIndex !== -1) {
                        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
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
                        } else if (e.key === 'Enter' && filteredContacts.length > 0 && !e.shiftKey) {
                          e.preventDefault()
                          const selectedContact = filteredContacts[selectedMentionIndex]
                          const beforeMention = input.substring(0, mentionMode.startIndex)
                          const afterMention = input.substring(mentionMode.cursorPosition)
                          const newValue = `${beforeMention}@${selectedContact.name} ${afterMention}`
                          setInput(newValue)
                          setMentionMode({ active: false, query: '', startIndex: 0, cursorPosition: 0 })
                          setSelectedMentionIndex(0)
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
                    className="w-full px-2 py-2.5 text-sm border-0 focus:outline-none disabled:bg-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-transparent text-black dark:text-white"
                    onFocus={() => setShowAttachMenu(false)}
                  />
                  
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
                              setTimeout(() => {
                                if (inputRef.current) {
                                  const cursorPos = beforeMention.length + contact.name.length + 2
                                  inputRef.current.setSelectionRange(cursorPos, cursorPos)
                                  inputRef.current.focus()
                                }
                              }, 0)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors ${
                              index === selectedMentionIndex ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                            }`}
                          >
                            <div className="font-medium text-black dark:text-white">{contact.name}</div>
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
                        <div className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
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
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  )
}
