'use client'

import { useEffect, useRef } from 'react'
import { SignalCard } from './SignalCard'
import type { Signal } from '@/lib/signals/types'
import { markFingerprintsSeen } from '@/lib/signals/storage'

interface SignalsModalProps {
  signals: Signal[]
  newFingerprints: Set<string>
  onClose: () => void
  onReviewInDashboard: () => void
}

export function SignalsModal({
  signals,
  newFingerprints,
  onClose,
  onReviewInDashboard,
}: SignalsModalProps) {
  const topSignals = [...signals]
    .sort((a, b) => {
      const order = { High: 0, Medium: 1, Low: 2 }
      return order[a.severity] - order[b.severity] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 3)

  const handleMarkReviewed = () => {
    markFingerprintsSeen([...newFingerprints])
    onClose()
  }

  // Close = mark as seen (per spec: "Mark when user clicks Mark as reviewed OR closes modal")
  const handleClose = () => {
    markFingerprintsSeen([...newFingerprints])
    onClose()
  }

  const closeRef = useRef(handleClose)
  closeRef.current = handleClose
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [])

  return (
    <>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" onClick={handleClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-6">
        <h2 className="text-lg font-semibold text-black dark:text-white mb-1">
          Hydra detected changes
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Live operational changes + recommended next moves.
        </p>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {topSignals.map((s) => (
            <SignalCard
              key={s.id}
              signal={s}
              isNew={newFingerprints.has(s.fingerprint)}
            />
          ))}
        </div>
        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onReviewInDashboard}
            className="flex-1 px-4 py-2 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Review in Dashboard
          </button>
          <button
            type="button"
            onClick={handleMarkReviewed}
            className="flex-1 px-4 py-2 text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Mark as reviewed
          </button>
        </div>
      </div>
    </>
  )
}
