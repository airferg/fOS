'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ThemeToggle from '@/components/ThemeToggle'

interface RoadmapItem {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  due_date: string
  priority: number
  function_context?: 'product' | 'marketing' | 'finance' | 'operations' | 'legal' | 'sales' | 'team' | 'analytics'
}

interface Recommendation {
  id: string
  title: string
  description: string
  canDoAgentically: boolean
  priority: 'high' | 'medium' | 'low'
  functionContext?: 'product' | 'marketing' | 'finance' | 'operations' | 'legal' | 'sales' | 'team' | 'analytics'
  action?: any
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

export default function RoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null)
  const [selectedFunctionFilter, setSelectedFunctionFilter] = useState<string>('all') // 'all' | 'product' | 'marketing' | etc.
  const [showEditNorthStar, setShowEditNorthStar] = useState(false)

  useEffect(() => {
    loadRoadmap()
    loadRecommendations()
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        // Only show agentic recommendations that can be converted to roadmap items
        setRecommendations((data.recommendations || []).slice(0, 5))
      }
    } catch (error) {
      console.error('Error loading recommendations:', error)
    }
  }

  const loadRoadmap = async () => {
    try {
      const res = await fetch('/api/roadmap')
      const data = await res.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error loading roadmap:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: 'todo' | 'in_progress' | 'done') => {
    try {
      await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      setItems(items.map(item => item.id === id ? { ...item, status } : item))
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return

    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: '',
          status: 'todo',
          priority: 0,
        }),
      })

      const data = await res.json()
      if (data.item) {
        setItems([...items, data.item])
        setNewTaskTitle('')
        setShowAddTask(false)
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const addRecommendationToRoadmap = async (rec: Recommendation) => {
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: rec.title,
          description: rec.description,
          status: 'todo',
          priority: rec.priority === 'high' ? 10 : rec.priority === 'medium' ? 5 : 0,
          function_context: rec.functionContext || null,
        }),
      })

      const data = await res.json()
      if (data.item) {
        setItems([...items, data.item])
        setRecommendations(recommendations.filter(r => r.id !== rec.id))
      }
    } catch (error) {
      console.error('Error adding recommendation:', error)
    }
  }

  const filteredItems = items.filter(item => 
    selectedFunctionFilter === 'all' || item.function_context === selectedFunctionFilter
  )
  
  const todoItems = filteredItems.filter(i => i.status === 'todo')
  const inProgressItems = filteredItems.filter(i => i.status === 'in_progress')
  const doneItems = filteredItems.filter(i => i.status === 'done')

  const totalTasks = filteredItems.length
  const completedPercentage = totalTasks > 0 ? Math.round((doneItems.length / totalTasks) * 100) : 0

  // Group items by status for visual flow
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return '○'
      case 'in_progress': return '◐'
      case 'done': return '●'
      default: return '○'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-zinc-950/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 sticky top-0 z-50">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <img src="/fOS.png" alt="fOS" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-black dark:text-white dark:text-white font-medium">
              Roadmap
            </Link>
            <Link href="/contacts" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Network
            </Link>
            <Link href="/documents" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Documents
            </Link>
            <Link href="/integrations" className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-400 hover:text-black dark:text-white dark:hover:text-white transition-colors">
              Integrations
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with North Star */}
        <div className="mb-8">
          {profile && (profile.building_description || profile.current_goal) && (
            <div className="bg-gradient-to-r from-black to-zinc-900 dark:from-white dark:to-zinc-100 rounded-xl p-6 mb-6 text-white dark:text-black shadow-lg relative group">
              <div className="flex items-center justify-between mb-3">
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
              {profile.building_description_summary && (
                <div className="text-2xl font-bold mb-2">
                  BUILDING: {profile.building_description_summary.toUpperCase()}
                </div>
              )}
              {profile.current_goal_summary && (
                <div className="text-lg font-semibold text-zinc-300 dark:text-zinc-700">
                  GOAL: {profile.current_goal_summary}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-black dark:text-white mb-2">Your Roadmap</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Visual progress towards your north star</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Function Filter Toggle */}
              <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
                <button
                  onClick={() => setSelectedFunctionFilter('all')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    selectedFunctionFilter === 'all'
                      ? 'bg-white dark:bg-zinc-950 text-black dark:text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white'
                  }`}
                >
                  All
                </button>
                {['product', 'marketing', 'finance', 'sales', 'operations', 'legal', 'team', 'analytics'].map((func) => (
                  <button
                    key={func}
                    onClick={() => setSelectedFunctionFilter(func)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors capitalize ${
                      selectedFunctionFilter === func
                        ? 'bg-white dark:bg-zinc-950 text-black dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white'
                    }`}
                  >
                    {func === 'operations' ? 'Ops' : func}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAddTask(true)}
                className="px-5 py-2.5 bg-black dark:bg-white text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md"
              >
                + Add Task
              </button>
            </div>
          </div>

          {/* Progress Bar - Game-like */}
          <div className="bg-white dark:bg-zinc-950 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-black dark:text-white">Progress</span>
              <span className="text-2xl font-bold text-black dark:text-white">{completedPercentage}%</span>
            </div>
            <div className="relative w-full bg-zinc-100 rounded-full h-4 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-black via-zinc-800 to-black rounded-full transition-all duration-500 ease-out shadow-inner"
                style={{ width: `${completedPercentage}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white mix-blend-difference">
                  {doneItems.length} / {totalTasks} completed
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm"></span>
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{todoItems.length} To Do</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></span>
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{inProgressItems.length} In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{doneItems.length} Done</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mb-8 bg-white dark:bg-zinc-950 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white mb-1">🎯 AI Recommendations</h3>
                <p className="text-xs text-zinc-500">Top tasks to advance your north star</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 border-2 border-zinc-300 rounded-lg bg-gradient-to-br from-zinc-50 to-white hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => addRecommendationToRoadmap(rec)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {rec.canDoAgentically && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-black dark:bg-white text-white">
                          AI
                        </span>
                      )}
                      {getFunctionBadge(rec.functionContext)}
                    </div>
                    <span className={`text-2xl ${rec.canDoAgentically ? 'opacity-60' : 'opacity-40'}`}>
                      {getStatusIcon('todo')}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-black dark:text-white mb-2 group-hover:text-zinc-700">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                    {rec.description}
                  </p>
                  <button className="w-full px-3 py-1.5 bg-black dark:bg-white text-white text-xs font-medium rounded hover:bg-zinc-800 transition-colors">
                    Add to Roadmap
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Roadmap - Node-based Design */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading roadmap...</div>
        ) : (
          <div className="space-y-8">
            {/* Visual Flow - Horizontal Nodes */}
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 transform -translate-y-1/2 z-0" />
              
              {/* Node Container */}
              <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 z-10">
                {/* To Do Column */}
                <div className="bg-white dark:bg-zinc-950 rounded-xl p-6 border-2 border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">○</span>
                      <h3 className="text-base font-bold text-black dark:text-white">To Do</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                      {todoItems.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {todoItems.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-sm">
                        <span className="text-4xl block mb-2 opacity-30">○</span>
                        No tasks yet
                      </div>
                    ) : (
                      todoItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg opacity-60">○</span>
                              {getFunctionBadge(item.function_context)}
                            </div>
                            <span className="text-xs text-zinc-500">{item.priority}/10</span>
                          </div>
                          <h4 className="text-sm font-semibold text-black dark:text-white mb-1 group-hover:text-zinc-700">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">{item.description}</p>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateStatus(item.id, 'in_progress')
                            }}
                            className="w-full py-2 bg-black dark:bg-white text-white text-xs font-medium rounded hover:bg-zinc-800 transition-colors"
                          >
                            Start →
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* In Progress Column */}
                <div className="bg-white dark:bg-zinc-950 rounded-xl p-6 border-2 border-blue-200 shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl text-blue-600">◐</span>
                      <h3 className="text-base font-bold text-black dark:text-white">In Progress</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {inProgressItems.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {inProgressItems.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-sm">
                        <span className="text-4xl block mb-2 opacity-30">◐</span>
                        No active tasks
                      </div>
                    ) : (
                      inProgressItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50 hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg text-blue-600">◐</span>
                              {getFunctionBadge(item.function_context)}
                            </div>
                            <span className="text-xs text-blue-600 font-medium">Active</span>
                          </div>
                          <h4 className="text-sm font-semibold text-black dark:text-white mb-1 group-hover:text-blue-700">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">{item.description}</p>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateStatus(item.id, 'done')
                            }}
                            className="w-full py-2 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                          >
                            ✓ Complete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Done Column */}
                <div className="bg-white dark:bg-zinc-950 rounded-xl p-6 border-2 border-green-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl text-green-600">●</span>
                      <h3 className="text-base font-bold text-black dark:text-white">Done</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      {doneItems.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {doneItems.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-sm">
                        <span className="text-4xl block mb-2 opacity-30">●</span>
                        No completed tasks
                      </div>
                    ) : (
                      doneItems.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="p-4 border border-green-200 rounded-lg bg-green-50/30 opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg text-green-600">●</span>
                              {getFunctionBadge(item.function_context)}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-black dark:text-white line-through opacity-60">
                                {item.title}
                              </h4>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black dark:bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddTask(false)}>
            <div className="bg-white dark:bg-zinc-950 rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Add New Task</h3>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm mb-4"
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={addTask}
                  className="flex-1 px-4 py-2.5 bg-black dark:bg-white text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Add Task
                </button>
                <button
                  onClick={() => {
                    setShowAddTask(false)
                    setNewTaskTitle('')
                  }}
                  className="flex-1 px-4 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit North Star Modal */}
      {showEditNorthStar && (
        <EditNorthStarModal
          buildingDescription={profile?.building_description || null}
          currentGoal={profile?.current_goal || null}
          onClose={() => setShowEditNorthStar(false)}
          onSave={handleSaveNorthStar}
        />
      )}
    </div>
  )
}
