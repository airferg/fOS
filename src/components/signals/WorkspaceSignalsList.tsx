'use client'

import { useState, useEffect } from 'react'
import { runRules } from '@/lib/signals/engine'
import { mockOperatingState } from '@/lib/signals/mockState'
import { getSeenFingerprints, markFingerprintsSeen } from '@/lib/signals/storage'
import type { Signal } from '@/lib/signals/types'
import { SignalRow } from './SignalRow'

// Bar-chart style icon for section header
function BarChartIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

interface WorkspaceSignalsListProps {
  onMarkSeen?: (fingerprint: string) => void
}

export function WorkspaceSignalsList({ onMarkSeen }: WorkspaceSignalsListProps) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [seen, setSeen] = useState<Set<string>>(new Set())

  useEffect(() => {
    const next = runRules(mockOperatingState)
    setSignals(next)
    setSeen(getSeenFingerprints())
  }, [])

  const handleDismiss = (fingerprint: string) => {
    markFingerprintsSeen([fingerprint])
    setSeen((prev) => new Set(prev).add(fingerprint))
    onMarkSeen?.(fingerprint)
  }

  const sortedSignals = [...signals].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 }
    return order[a.severity] - order[b.severity] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="h-full flex flex-col bg-white text-zinc-900 border border-zinc-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-zinc-200 shrink-0">
        <span className="text-sm font-medium text-zinc-900">Signals</span>
        <span className="text-zinc-400 ml-1">▼</span>
      </div>

      {/* Section: Recommended N */}
      <div className="px-4 py-2 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50/50">
        <BarChartIcon className="w-4 h-4 text-zinc-500" />
        <span className="text-xs font-medium text-zinc-500">
          Signals {sortedSignals.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sortedSignals.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-zinc-500">
            No recommended moves right now. Hydra will surface actions as changes occur.
          </div>
        ) : (
          <ul>
            {sortedSignals.map((signal) => (
              <li key={signal.id}>
                <SignalRow
                  signal={signal}
                  isSeen={seen.has(signal.fingerprint)}
                  onDismiss={handleDismiss}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
