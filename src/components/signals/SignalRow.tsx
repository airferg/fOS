'use client'

import Link from 'next/link'
import type { Signal, SignalCategory } from '@/lib/signals/types'
import { SIGNAL_WORKFLOW_IDS } from '@/components/workspace/agentResponses'

const categoryIcons: Record<SignalCategory, React.ReactNode> = {
  Execution: (
    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Team: (
    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Product: (
    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  Funding: (
    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  GTM: (
    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
}

const severityDotStyles = {
  Low: 'bg-zinc-300',
  Medium: 'bg-amber-500',
  High: 'bg-orange-500',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface SignalRowProps {
  signal: Signal
  isSeen?: boolean
  onDismiss?: (fingerprint: string) => void
}

export function SignalRow({ signal, isSeen, onDismiss }: SignalRowProps) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-b-0">
      <div className="flex-shrink-0 w-8 flex justify-center text-zinc-500">
        {categoryIcons[signal.category]}
      </div>
      {onDismiss != null ? (
        <button
          type="button"
          onClick={() => onDismiss(signal.fingerprint)}
          className="flex-shrink-0 p-0.5 rounded text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          title={isSeen ? 'Already reviewed' : 'Mark as reviewed'}
        >
          {isSeen ? (
            <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
          )}
        </button>
      ) : (
        <span className="flex-shrink-0 w-4" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 truncate">
          {signal.title}
        </p>
        {signal.evidence && (
          <p className="text-xs text-zinc-500 truncate mt-0.5">
            {signal.evidence}
          </p>
        )}
      </div>
      <span className="flex-shrink-0 text-xs text-zinc-500">
        {formatDate(signal.createdAt)}
      </span>
      <span
        className={`flex-shrink-0 w-2 h-2 rounded-full ${severityDotStyles[signal.severity]}`}
        title={signal.severity}
      />
      <Link
        href={SIGNAL_WORKFLOW_IDS.includes(signal.shortId as (typeof SIGNAL_WORKFLOW_IDS)[number]) ? `/workspace?view=chat&run=${signal.shortId}` : signal.ctaHref}
        className="flex-shrink-0 text-xs font-medium text-orange-600 hover:text-orange-700 whitespace-nowrap px-2 py-1 rounded hover:bg-orange-50 transition-colors"
      >
        {signal.ctaLabel} →
      </Link>
    </div>
  )
}
