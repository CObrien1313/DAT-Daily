// ── Plan limits ───────────────────────────────────────────────────────────────

export const FREE_LIMITS = {
  schedules_per_week:  1,
  recovery_per_week:   1,
  battles_per_day:     1,
  quiz_questions:     10,
} as const

export const PRO_LIMITS = {
  quiz_questions: 30,
} as const

export type Plan = 'free' | 'pro'

// ── Usage summary shape (returned by /api/usage) ──────────────────────────────

export interface UsageCounter {
  used:      number
  limit:     number   // Infinity for pro
  resets_at: string | null
}

export interface UsageSummary {
  plan:      Plan
  schedules: UsageCounter
  recovery:  UsageCounter
  battles:   UsageCounter
}

// ── Reset helpers (pure, used in both API routes and client) ──────────────────

export function needsWeekReset(weekStart: string | null | undefined): boolean {
  if (!weekStart) return true
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return new Date(weekStart).getTime() < sevenDaysAgo
}

export function needsDayReset(dayStart: string | null | undefined): boolean {
  if (!dayStart) return true
  const d = new Date(dayStart)
  const now = new Date()
  return (
    d.getUTCFullYear() !== now.getUTCFullYear() ||
    d.getUTCMonth()    !== now.getUTCMonth()    ||
    d.getUTCDate()     !== now.getUTCDate()
  )
}

/** ISO string for the start of tomorrow UTC — used as resets_at for daily limits */
export function tomorrowUTC(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 1)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

/** Add N days to an ISO timestamp */
export function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}
