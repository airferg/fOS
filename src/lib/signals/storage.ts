/**
 * localStorage gating: track seen signal fingerprints and weekly modal last shown.
 */

const SEEN_FINGERPRINTS_KEY = 'hydra_signals_seen'
const WEEKLY_MODAL_LAST_SHOWN_KEY = 'hydra_signals_weekly_last_shown'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function getSeenFingerprints(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(SEEN_FINGERPRINTS_KEY)
    const arr = raw ? (JSON.parse(raw) as string[]) : []
    return new Set(arr)
  } catch {
    return new Set()
  }
}

export function markFingerprintsSeen(fingerprints: string[]): void {
  if (typeof window === 'undefined') return
  try {
    const seen = getSeenFingerprints()
    fingerprints.forEach((f) => seen.add(f))
    localStorage.setItem(SEEN_FINGERPRINTS_KEY, JSON.stringify([...seen]))
  } catch {
    // ignore
  }
}

export function isNewSignal(fingerprint: string): boolean {
  return !getSeenFingerprints().has(fingerprint)
}

export function getWeeklyModalLastShown(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(WEEKLY_MODAL_LAST_SHOWN_KEY)
    return raw ? parseInt(raw, 10) : null
  } catch {
    return null
  }
}

export function setWeeklyModalLastShown(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(WEEKLY_MODAL_LAST_SHOWN_KEY, String(Date.now()))
  } catch {
    // ignore
  }
}

/** Should we show the weekly summary modal? (once per week) */
export function shouldShowWeeklyModal(): boolean {
  const last = getWeeklyModalLastShown()
  if (last === null) return true
  return Date.now() - last >= WEEK_MS
}
