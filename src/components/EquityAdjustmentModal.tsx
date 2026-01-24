'use client'

import { useState } from 'react'

interface TeamMember {
  id: string
  name: string
  role: string
  title: string
  equity_percent: number
  vested_percent: number
  avatar_url: string | null
  email: string | null
  start_date?: string
  vesting_schedules?: Array<{
    cliff_months?: number
    duration_months?: number
    start_date?: string
  }>
}

interface EquityAdjustmentModalProps {
  member: TeamMember
  onClose: () => void
  onSave: (memberId: string, updates: Partial<TeamMember>) => void
}

export default function EquityAdjustmentModal({ member, onClose, onSave }: EquityAdjustmentModalProps) {
  const [formData, setFormData] = useState({
    equity_percent: member.equity_percent,
    vested_percent: member.vested_percent,
    title: member.title,
    role: member.role,
  })

  const handleSave = () => {
    onSave(member.id, formData)
    onClose()
  }

  // Get vesting schedule info
  const vestingSchedule = member.vesting_schedules?.[0]
  const cliffMonths = vestingSchedule?.cliff_months || 12
  const durationMonths = vestingSchedule?.duration_months || 48
  const startDate = vestingSchedule?.start_date || member.start_date || new Date().toISOString()
  const startDateFormatted = new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-950 rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                {member.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-sm font-semibold text-black dark:text-white">{member.name}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.title || member.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-black dark:text-white mb-1.5">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-black dark:text-white"
            >
              <option value="Founder">Founder</option>
              <option value="Co-Founder">Co-Founder</option>
              <option value="Employee">Employee</option>
              <option value="Advisor">Advisor</option>
              <option value="Contractor">Contractor</option>
            </select>
          </div>

          {/* Title/Position */}
          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Title / Position
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., CEO, CTO, Senior Engineer"
              className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-black dark:text-white"
            />
          </div>

          {/* Equity Percentage */}
          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Equity Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.equity_percent.toFixed(2)}
                onChange={(e) => setFormData({ ...formData, equity_percent: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 pr-20 border-2 border-blue-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, equity_percent: Math.min(100, formData.equity_percent + 0.01) })}
                    className="text-zinc-500 hover:text-black dark:hover:text-white leading-none"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, equity_percent: Math.max(0, formData.equity_percent - 0.01) })}
                    className="text-zinc-500 hover:text-black dark:hover:text-white leading-none"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">%</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              Current: {Math.round(formData.equity_percent)}%
            </p>
          </div>

          {/* Vesting Progress */}
          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Vesting Progress
            </label>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-semibold text-black dark:text-white">
                {formData.vested_percent}
              </span>
              <span className="text-2xl font-semibold text-black dark:text-white">%</span>
            </div>
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-black dark:bg-white transition-all"
                style={{ width: `${formData.vested_percent}%` }}
              />
            </div>
          </div>

          {/* Vesting Schedule */}
          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Vesting Schedule
            </label>
            <div className="space-y-0.5">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {durationMonths / 12} years, {cliffMonths / 12} year cliff
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Start Date: {startDateFormatted}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-white dark:text-black bg-black dark:bg-white rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
