'use client'

import { useState } from 'react'

interface EditNorthStarModalProps {
  buildingDescription: string | null
  currentGoal: string | null
  onClose: () => void
  onSave: (buildingDescription: string, currentGoal: string) => Promise<void>
}

export default function EditNorthStarModal({ buildingDescription, currentGoal, onClose, onSave }: EditNorthStarModalProps) {
  const [building, setBuilding] = useState(buildingDescription || '')
  const [goal, setGoal] = useState(currentGoal || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!building.trim() && !goal.trim()) {
      alert('Please enter at least a building description or current goal')
      return
    }

    setSaving(true)
    try {
      await onSave(building.trim(), goal.trim())
      onClose()
    } catch (error: any) {
      alert(`Failed to update North Star: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">Edit North Star</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Update what you're building and your current goal</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
            >
              <svg className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Building Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white">
                What are you building? <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">A brief description of your startup or project</p>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="e.g., An AI-powered CRM for startups"
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-900 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600"
              />
            </div>

            {/* Current Goal */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black dark:text-white">
                Current Goal
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">What's your immediate focus or objective?</p>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Launch MVP in 3 months, get first 10 customers, raise seed round"
                rows={4}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 bg-white dark:bg-zinc-900 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!building.trim() && !goal.trim())}
            className="px-4 py-2 text-sm font-semibold text-white dark:text-black bg-black dark:bg-white rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

