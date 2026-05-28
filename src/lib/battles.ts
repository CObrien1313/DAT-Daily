// ── Battle types ──────────────────────────────────────────────────────────────

export const BATTLE_TYPES = [
  {
    id: 'combined' as const,
    label: 'Combined Score',
    description: 'Study minutes + daily question bonus',
    emoji: '⚔️',
  },
  {
    id: 'study_time' as const,
    label: 'Study Time',
    description: 'Most minutes studied',
    emoji: '⏱️',
  },
  {
    id: 'streak' as const,
    label: 'Streak Battle',
    description: 'Longest active streak when battle ends',
    emoji: '🔥',
  },
]

export type BattleType = 'combined' | 'study_time' | 'streak'

// ── Subjects (only used for study_time / combined) ────────────────────────────

export const BATTLE_SUBJECTS = [
  { id: null as string | null, label: 'All Subjects',          emoji: '📚' },
  { id: 'Biology',              label: 'Biology',              emoji: '🧬' },
  { id: 'General Chemistry',    label: 'Gen Chem',             emoji: '⚗️' },
  { id: 'Organic Chemistry',    label: 'Orgo',                 emoji: '🧪' },
  { id: 'PAT',                  label: 'PAT',                  emoji: '🔷' },
  { id: 'Reading Comprehension',label: 'RC',                   emoji: '📖' },
  { id: 'Quantitative Reasoning', label: 'QR',                 emoji: '🔢' },
]

// ── Durations ─────────────────────────────────────────────────────────────────

export const BATTLE_DURATIONS = [
  { hours: 1,   label: '1 Hour',  short: '1h' },
  { hours: 24,  label: 'Today',   short: '24h' },
  { hours: 72,  label: '3 Days',  short: '3d' },
  { hours: 168, label: '1 Week',  short: '7d' },
]

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface BattleProfile {
  id: string
  name: string
  username: string
  level: number
  current_streak: number
}

export interface BattleScore {
  user_id: string
  score: number
  questions: number
  correct: number
  minutes: number
}

export interface Battle {
  id: string
  challenger_id: string
  opponent_id: string
  status: 'pending' | 'active' | 'completed' | 'declined'
  battle_type: BattleType
  subject: string | null
  duration_hours: number
  starts_at: string | null
  ends_at: string | null
  winner_id: string | null
  created_at: string
}

export interface BattleWithProfiles extends Battle {
  challenger: BattleProfile
  opponent: BattleProfile
  scores?: BattleScore[]
}

// ── XP rewards ────────────────────────────────────────────────────────────────

export const BATTLE_XP = {
  WIN:        75,
  CLOSE_LOSS: 40, // lost by < 10%
  LOSE:       25,
  TIE:        30,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getBattleTypeInfo(type: BattleType) {
  return BATTLE_TYPES.find((t) => t.id === type) ?? BATTLE_TYPES[0]
}

export function formatTimeRemaining(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return 'Ended'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h left`
  if (h > 0)   return `${h}h ${m}m left`
  return `${m}m left`
}

export function formatScore(score: number, type: BattleType): string {
  if (type === 'study_time') return `${Math.round(score)}m`
  if (type === 'combined')   return Number(score).toFixed(1)
  return String(Math.round(score))
}

/** Whether this battle type uses a subject filter (study_time and combined filter by subject) */
export function hasSubjectFilter(type: BattleType): boolean {
  return type === 'study_time' || type === 'combined'
}

// ── Future: Premium real-time quiz battle ─────────────────────────────────────
// Plan: Add a "Quiz Duel" battle type where both players answer the same DAT-style
// questions simultaneously (like Trivia Crack). First to answer correctly wins the
// question. Best of N questions wins the battle. This will require a subscription
// and a dedicated real-time question bank. Do NOT build until premium/paywall
// infrastructure is in place.
