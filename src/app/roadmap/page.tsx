'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface RoadmapItem {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  due_date: string
  priority: number
}

export default function RoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)

  useEffect(() => {
    loadRoadmap()
  }, [])

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

  const todoItems = items.filter(i => i.status === 'todo')
  const inProgressItems = items.filter(i => i.status === 'in_progress')
  const doneItems = items.filter(i => i.status === 'done')

  const totalTasks = items.length
  const completedPercentage = totalTasks > 0 ? Math.round((doneItems.length / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-zinc-200">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-medium text-black">FounderOS</h1>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-zinc-600 hover:text-black transition-colors">
              Dashboard
            </Link>
            <Link href="/roadmap" className="text-black font-medium">
              Roadmap
            </Link>
            <Link href="/contacts" className="text-zinc-600 hover:text-black transition-colors">
              Network
            </Link>
            <Link href="/documents" className="text-zinc-600 hover:text-black transition-colors">
              Documents
            </Link>
            <Link href="/integrations" className="text-zinc-600 hover:text-black transition-colors">
              Integrations
            </Link>
            <Link href="/dev" className="text-zinc-600 hover:text-black transition-colors">
              Dev
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-black">Roadmap</h2>
              <p className="text-sm text-zinc-600 mt-1">Your path to traction</p>
            </div>
            <button
              onClick={() => setShowAddTask(true)}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
            >
              + Add Task
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-lg p-6 border border-zinc-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-black">Overall Progress</span>
              <span className="text-sm font-semibold text-black">{completedPercentage}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-3">
              <div
                className="bg-black h-3 rounded-full transition-all duration-300"
                style={{ width: `${completedPercentage}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-zinc-600">{todoItems.length} To Do</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-zinc-600">{inProgressItems.length} In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-zinc-600">{doneItems.length} Done</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-black mb-4">Add New Task</h3>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm mb-4"
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={addTask}
                  className="flex-1 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Add Task
                </button>
                <button
                  onClick={() => {
                    setShowAddTask(false)
                    setNewTaskTitle('')
                  }}
                  className="flex-1 px-4 py-2 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* To Do Column */}
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <h3 className="text-base font-semibold text-black">To Do</h3>
                </div>
                <span className="text-sm font-medium text-zinc-500">{todoItems.length}</span>
              </div>
              <div className="space-y-3">
                {todoItems.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-8">No tasks yet</p>
                ) : (
                  todoItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-zinc-200 rounded-lg hover:shadow-sm transition-shadow bg-white"
                    >
                      <h4 className="text-sm font-semibold text-black mb-2">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-zinc-600 mb-3 line-clamp-2">{item.description}</p>
                      )}
                      {item.due_date && (
                        <p className="text-xs text-zinc-500 mb-3 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(item.due_date).toLocaleDateString()}
                        </p>
                      )}
                      <button
                        onClick={() => updateStatus(item.id, 'in_progress')}
                        className="w-full py-2 bg-black text-white text-xs font-medium rounded hover:bg-zinc-800 transition-colors"
                      >
                        Start Task →
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <h3 className="text-base font-semibold text-black">In Progress</h3>
                </div>
                <span className="text-sm font-medium text-zinc-500">{inProgressItems.length}</span>
              </div>
              <div className="space-y-3">
                {inProgressItems.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-8">No tasks in progress</p>
                ) : (
                  inProgressItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50 hover:shadow-sm transition-shadow"
                    >
                      <h4 className="text-sm font-semibold text-black mb-2">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-zinc-600 mb-3 line-clamp-2">{item.description}</p>
                      )}
                      {item.due_date && (
                        <p className="text-xs text-zinc-500 mb-3 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(item.due_date).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(item.id, 'done')}
                          className="flex-1 py-2 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                        >
                          ✓ Complete
                        </button>
                        <button
                          onClick={() => updateStatus(item.id, 'todo')}
                          className="px-3 py-2 border border-zinc-300 text-zinc-700 text-xs rounded hover:bg-zinc-50 transition-colors"
                        >
                          ←
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Done Column */}
            <div className="bg-white rounded-lg p-6 border border-zinc-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h3 className="text-base font-semibold text-black">Done</h3>
                </div>
                <span className="text-sm font-medium text-zinc-500">{doneItems.length}</span>
              </div>
              <div className="space-y-3">
                {doneItems.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-8">No completed tasks</p>
                ) : (
                  doneItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-zinc-200 rounded-lg bg-green-50 opacity-75"
                    >
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-black line-through">{item.title}</h4>
                          {item.description && (
                            <p className="text-xs text-zinc-600 mt-1 line-clamp-2 line-through">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
