'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

interface Agent {
  id: string
  name: string
  description: string
  category: string
  icon: string
}

interface AgentTask {
  id: string
  agent_id: string
  agent_name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  tokens_used?: number
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [recentTasks, setRecentTasks] = useState<AgentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [executingAgent, setExecutingAgent] = useState<string | null>(null)

  useEffect(() => {
    loadAgents()
    loadHistory()
  }, [])

  const loadAgents = async () => {
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      setAgents(data.agents || [])
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/agents/history?limit=10')
      const data = await res.json()
      setRecentTasks(data.tasks || [])
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const executeAgent = async (agentId: string) => {
    setExecutingAgent(agentId)
    try {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, input: {} })
      })

      const data = await res.json()

      if (data.success) {
        alert(`Agent executed successfully!\n\nTokens used: ${data.tokensUsed || 0}`)
        loadHistory()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Failed to execute agent: ${error.message}`)
    } finally {
      setExecutingAgent(null)
    }
  }

  const categories = ['all', ...Array.from(new Set(agents.map(a => a.category)))]
  const filteredAgents = selectedCategory === 'all'
    ? agents
    : agents.filter(a => a.category === selectedCategory)

  const groupedAgents = filteredAgents.reduce((acc, agent) => {
    if (!acc[agent.category]) {
      acc[agent.category] = []
    }
    acc[agent.category].push(agent)
    return acc
  }, {} as Record<string, Agent[]>)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-zinc-950 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 dark:border-zinc-800">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <img src="/fOS.png" alt="fOS" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Roadmap
            </Link>
            <Link href="/contacts" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Network
            </Link>
            <Link href="/documents" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Documents
            </Link>
            <Link href="/agents" className="text-black dark:text-white dark:text-white font-medium">
              AI Agents
            </Link>
            <Link href="/integrations" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Integrations
            </Link>
            <Link href="/dev" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Dev
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-black dark:text-white">AI Agents</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Autonomous agents that execute tasks for you
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Available Agents</div>
            <div className="text-3xl font-semibold text-black dark:text-white mt-2">{agents.length}</div>
          </div>
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Tasks Executed</div>
            <div className="text-3xl font-semibold text-black dark:text-white mt-2">{recentTasks.length}</div>
          </div>
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Success Rate</div>
            <div className="text-3xl font-semibold text-black dark:text-white mt-2">
              {recentTasks.length > 0
                ? Math.round((recentTasks.filter(t => t.status === 'completed').length / recentTasks.length) * 100)
                : 0}%
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                ? 'bg-black text-white'
                : 'bg-white dark:bg-zinc-950 text-zinc-700 border border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900'
                }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>

        {/* Agents Grid by Category */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading agents...</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedAgents).map(([category, categoryAgents]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryAgents.map(agent => (
                    <div
                      key={agent.id}
                      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-3xl">{agent.icon}</span>
                        {recentTasks.find(t => t.agent_id === agent.id && t.status === 'completed') && (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Used
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-semibold text-black dark:text-white mb-2">{agent.name}</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">{agent.description}</p>

                      <button
                        onClick={() => executeAgent(agent.id)}
                        disabled={executingAgent === agent.id}
                        className="w-full py-2 bg-black text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed"
                      >
                        {executingAgent === agent.id ? 'Executing...' : 'Execute'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Executions */}
        {recentTasks.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Recent Executions</h3>
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Tokens
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {recentTasks.map(task => (
                    <tr key={task.id} className="hover:bg-zinc-50 dark:bg-zinc-900">
                      <td className="px-6 py-4 text-sm text-black dark:text-white">{task.agent_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : task.status === 'running'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-zinc-100 text-zinc-800'
                          }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {new Date(task.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {task.tokens_used?.toLocaleString() || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
