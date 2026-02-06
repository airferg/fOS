'use client'

import { useEffect } from 'react'
import type { Signal } from '@/lib/signals/types'
import { setWeeklyModalLastShown } from '@/lib/signals/storage'

interface WeeklySummaryModalProps {
  signals: Signal[]
  onClose: () => void
}

export function WeeklySummaryModal({ signals, onClose }: WeeklySummaryModalProps) {
  const highRisks = signals.filter((s) => s.severity === 'High')
  const mediumRisks = signals.filter((s) => s.severity === 'Medium')
  const topRisks = [...highRisks, ...mediumRisks].slice(0, 3)
  const recommendedMoves = [...signals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const handleClose = () => {
    setWeeklyModalLastShown()
    onClose()
  }

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" onClick={handleClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-6">
        <h2 className="text-lg font-semibold text-black dark:text-white mb-1">
          This Week in Hydra
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
          Weekly summary of changes and recommended moves.
        </p>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-black dark:text-white mb-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              What changed
            </h3>
            <p className="text-xs text-zinc-700 dark:text-zinc-300">
              {signals.length} operational signal{signals.length !== 1 ? 's' : ''} detected across Product, GTM, Team, Funding, and Execution.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-black dark:text-white mb-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Top risks
            </h3>
            <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-0.5">
              {topRisks.length ? topRisks.map((s) => (
                <li key={s.id}>• {s.title}</li>
              )) : <li>• No high-priority risks this week.</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-black dark:text-white mb-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Recommended next moves
            </h3>
            <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-0.5">
              {recommendedMoves.length ? recommendedMoves.map((s) => (
                <li key={s.id}>• {s.recommendation}</li>
              )) : <li>• Review your dashboard and keep momentum.</li>}
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="mt-6 w-full px-4 py-2 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Got it
        </button>
      </div>
    </>
  )
}
