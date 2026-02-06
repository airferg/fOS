'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SignalRow } from './SignalRow'
import type { Signal } from '@/lib/signals/types'
import { getSeenFingerprints, markFingerprintsSeen } from '@/lib/signals/storage'

const VISIBLE_COUNT = 3

function BarChartIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

interface SignalsPanelProps {
  signals: Signal[]
  panelRef?: React.RefObject<HTMLDivElement | null>
}

export function SignalsPanel({ signals, panelRef }: SignalsPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [seen, setSeen] = useState<Set<string>>(new Set())

  const sorted = [...signals].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 }
    return order[a.severity] - order[b.severity] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_COUNT)
  const hasMore = signals.length > VISIBLE_COUNT

  const handleDismiss = (fingerprint: string) => {
    markFingerprintsSeen([fingerprint])
    setSeen((prev) => new Set(prev).add(fingerprint))
  }

  useEffect(() => {
    setSeen(getSeenFingerprints())
  }, [signals.length])

  return (
    <div ref={panelRef} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-900">Signals</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Live operational changes + recommended next moves.
        </p>
      </div>
      <div className="border-b border-zinc-100 px-4 py-2 flex items-center gap-2 bg-zinc-50/50">
        <BarChartIcon className="w-4 h-4 text-zinc-500" />
        <span className="text-xs font-medium text-zinc-500">
          Signals {visible.length}{!expanded && hasMore ? ` (top ${VISIBLE_COUNT})` : ''}
        </span>
      </div>
      <div>
        {visible.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center px-4">
            No signals this week. Hydra will surface changes as they occur.
          </p>
        ) : (
          visible.map((signal) => (
            <SignalRow
              key={signal.id}
              signal={signal}
              isSeen={seen.has(signal.fingerprint)}
              onDismiss={handleDismiss}
            />
          ))
        )}
        {hasMore && !expanded && (
          <Link
            href="/workspace?view=signals"
            className="block w-full py-2.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-colors text-center border-t border-zinc-100"
          >
            View all ({signals.length}) in Workspace →
          </Link>
        )}
      </div>
    </div>
  )
}
