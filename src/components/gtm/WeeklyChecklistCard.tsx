'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

const defaultItems: ChecklistItem[] = [
  { id: '1', text: 'Ship 1 message test', completed: false },
  { id: '2', text: 'Run 5 outbound touches', completed: false },
  { id: '3', text: 'Review funnel', completed: false },
  { id: '4', text: 'Log learnings', completed: false }
]

export default function WeeklyChecklistCard() {
  const [items, setItems] = useState<ChecklistItem[]>(defaultItems)
  const [newItemText, setNewItemText] = useState('')
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
    return `Week ${weekNumber}, ${now.getFullYear()}`
  })

  const handleToggle = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const handleAdd = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false
      }
      setItems([...items, newItem])
      setNewItemText('')
    }
  }

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const completedCount = items.filter(i => i.completed).length
  const totalCount = items.length

  return (
    <div className="bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-black/5">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-black dark:text-white">Weekly GTM Checklist</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Operating rhythm</p>
        </div>
        <select
          value={currentWeek}
          onChange={(e) => setCurrentWeek(e.target.value)}
          className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option>{currentWeek}</option>
          <option>Week 3, 2026</option>
          <option>Week 2, 2026</option>
          <option>Week 1, 2026</option>
        </select>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Progress: {completedCount}/{totalCount}
            </span>
            <div className="w-24 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleToggle(item.id)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-orange-500 focus:ring-orange-500 focus:ring-2"
              />
              <span
                className={`flex-1 text-xs ${
                  item.completed
                    ? 'text-zinc-400 dark:text-zinc-600 line-through'
                    : 'text-black dark:text-white'
                }`}
              >
                {item.text}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-xs text-red-500 hover:text-red-700 transition-opacity"
              >
                ×
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add item..."
            className="flex-1 px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
