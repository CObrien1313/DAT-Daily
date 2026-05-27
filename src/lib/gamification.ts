// ── XP Rewards ────────────────────────────────────────────────────────────────

export const XP_REWARDS = {
  LOG_SESSION_BASE: 10,
  LOG_SESSION_PER_10MIN: 1,
  COMPLETE_TASK: 5,
  DAILY_QUESTION_CORRECT: 15,
  DAILY_QUESTION_ANY: 5,
  RECOVERY_QUIZ_PASS: 20,
  RECOVERY_QUIZ_COMPLETE: 10,
  STREAK_BONUS_3: 5,
  STREAK_BONUS_7: 10,
  STREAK_BONUS_14: 20,
} as const

export type XPActionType =
  | 'LOG_SESSION'
  | 'COMPLETE_TASK'
  | 'DAILY_QUESTION_CORRECT'
  | 'DAILY_QUESTION_ANY'
  | 'RECOVERY_QUIZ_PASS'
  | 'RECOVERY_QUIZ_COMPLETE'

export interface XPAction {
  type: XPActionType
  /** Minutes studied — only used for LOG_SESSION */
  minutes?: number
}

export function calculateXP(action: XPAction, streakDays = 0): number {
  switch (action.type) {
    case 'LOG_SESSION': {
      const base = XP_REWARDS.LOG_SESSION_BASE
      const timeBonus = Math.floor((action.minutes ?? 0) / 10) * XP_REWARDS.LOG_SESSION_PER_10MIN
      const streakBonus =
        streakDays >= 14 ? XP_REWARDS.STREAK_BONUS_14 :
        streakDays >= 7  ? XP_REWARDS.STREAK_BONUS_7 :
        streakDays >= 3  ? XP_REWARDS.STREAK_BONUS_3 : 0
      return base + timeBonus + streakBonus
    }
    case 'COMPLETE_TASK':          return XP_REWARDS.COMPLETE_TASK
    case 'DAILY_QUESTION_CORRECT': return XP_REWARDS.DAILY_QUESTION_CORRECT
    case 'DAILY_QUESTION_ANY':     return XP_REWARDS.DAILY_QUESTION_ANY
    case 'RECOVERY_QUIZ_PASS':     return XP_REWARDS.RECOVERY_QUIZ_PASS
    case 'RECOVERY_QUIZ_COMPLETE': return XP_REWARDS.RECOVERY_QUIZ_COMPLETE
  }
}

// ── Levels ────────────────────────────────────────────────────────────────────

export interface Level {
  level: number
  title: string
  minXP: number
  maxXP: number  // inclusive; Infinity for the last level
}

export const LEVELS: Level[] = [
  { level: 1,  title: 'Premed Recruit',   minXP: 0,    maxXP: 99 },
  { level: 2,  title: 'Study Starter',    minXP: 100,  maxXP: 249 },
  { level: 3,  title: 'Formula Learner',  minXP: 250,  maxXP: 499 },
  { level: 4,  title: 'Concept Builder',  minXP: 500,  maxXP: 899 },
  { level: 5,  title: 'Knowledge Seeker', minXP: 900,  maxXP: 1399 },
  { level: 6,  title: 'Discipline Pro',   minXP: 1400, maxXP: 2099 },
  { level: 7,  title: 'Subject Master',   minXP: 2100, maxXP: 2999 },
  { level: 8,  title: 'DAT Veteran',      minXP: 3000, maxXP: 4199 },
  { level: 9,  title: 'Elite Scorer',     minXP: 4200, maxXP: 5999 },
  { level: 10, title: 'DAT Champion',     minXP: 6000, maxXP: Infinity },
]

export function getLevelFromXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i]
  }
  return LEVELS[0]
}

export interface XPProgress {
  level: Level
  pct: number
  xpInLevel: number
  xpToNext: number
}

export function getXPProgress(xp: number): XPProgress {
  const level = getLevelFromXP(xp)
  if (level.maxXP === Infinity) {
    return { level, pct: 100, xpInLevel: xp - level.minXP, xpToNext: 0 }
  }
  const range = level.maxXP + 1 - level.minXP
  const xpInLevel = xp - level.minXP
  const pct = Math.min(100, Math.round((xpInLevel / range) * 100))
  return { level, pct, xpInLevel, xpToNext: level.maxXP + 1 - xp }
}

// ── Achievements ──────────────────────────────────────────────────────────────

export interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_session',
    title: 'First Step',
    description: 'Log your first study session',
    emoji: '🚀',
  },
  {
    id: 'first_question',
    title: 'Daily Devotion',
    description: 'Answer your first daily question',
    emoji: '❓',
  },
  {
    id: 'first_recovery',
    title: 'Recovery Mode',
    description: 'Generate your first recovery plan',
    emoji: '⚡',
  },
  {
    id: 'first_task',
    title: 'Task Master',
    description: 'Complete your first study task',
    emoji: '✅',
  },
  {
    id: 'streak_3',
    title: 'On a Roll',
    description: 'Maintain a 3-day study streak',
    emoji: '🔥',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Achieve a 7-day study streak',
    emoji: '💪',
  },
  {
    id: 'streak_14',
    title: 'Fortnight Force',
    description: 'Achieve a 14-day study streak',
    emoji: '🏋️',
  },
  {
    id: 'hours_10',
    title: 'Committed',
    description: 'Log 10 total hours of studying',
    emoji: '⏱️',
  },
  {
    id: 'hours_50',
    title: 'Half Century',
    description: 'Log 50 total hours of studying',
    emoji: '🏅',
  },
  {
    id: 'hours_100',
    title: 'Century Club',
    description: 'Log 100 total hours of studying',
    emoji: '💯',
  },
  {
    id: 'all_subjects',
    title: 'Well-Rounded',
    description: 'Study all 6 DAT subjects at least once',
    emoji: '🌈',
  },
  {
    id: 'marathon',
    title: 'Marathon Session',
    description: 'Log a single session of 3+ hours',
    emoji: '⏳',
  },
  {
    id: 'questions_10',
    title: 'Question Seeker',
    description: 'Answer 10 daily questions',
    emoji: '🎯',
  },
  {
    id: 'questions_30',
    title: 'Question Crusher',
    description: 'Answer 30 daily questions',
    emoji: '🎳',
  },
  {
    id: 'correct_10',
    title: 'Sharp Mind',
    description: 'Answer 10 daily questions correctly',
    emoji: '🧠',
  },
  {
    id: 'recovery_5',
    title: 'Comeback Kid',
    description: 'Generate 5 recovery plans',
    emoji: '💡',
  },
  {
    id: 'level_5',
    title: 'Rising Star',
    description: 'Reach Level 5: Knowledge Seeker',
    emoji: '⭐',
  },
  {
    id: 'level_10',
    title: 'Pinnacle',
    description: 'Reach Level 10: DAT Champion',
    emoji: '🏆',
  },
]

// ── Achievement checking ──────────────────────────────────────────────────────

export interface AchievementStats {
  totalSessions: number
  totalHours: number
  longestStreak: number
  totalTasksCompleted: number
  dailyQuestionsAnswered: number
  dailyQuestionsCorrect: number
  recoveryPlansGenerated: number
  subjectsStudied: number   // unique subjects with at least one session
  singleSessionMaxMinutes: number
  level: number
}

export function checkAchievements(stats: AchievementStats): string[] {
  const unlocked: string[] = []

  if (stats.totalSessions >= 1)           unlocked.push('first_session')
  if (stats.dailyQuestionsAnswered >= 1)  unlocked.push('first_question')
  if (stats.recoveryPlansGenerated >= 1)  unlocked.push('first_recovery')
  if (stats.totalTasksCompleted >= 1)     unlocked.push('first_task')
  if (stats.longestStreak >= 3)           unlocked.push('streak_3')
  if (stats.longestStreak >= 7)           unlocked.push('streak_7')
  if (stats.longestStreak >= 14)          unlocked.push('streak_14')
  if (stats.totalHours >= 10)             unlocked.push('hours_10')
  if (stats.totalHours >= 50)             unlocked.push('hours_50')
  if (stats.totalHours >= 100)            unlocked.push('hours_100')
  if (stats.subjectsStudied >= 6)         unlocked.push('all_subjects')
  if (stats.singleSessionMaxMinutes >= 180) unlocked.push('marathon')
  if (stats.dailyQuestionsAnswered >= 10) unlocked.push('questions_10')
  if (stats.dailyQuestionsAnswered >= 30) unlocked.push('questions_30')
  if (stats.dailyQuestionsCorrect >= 10)  unlocked.push('correct_10')
  if (stats.recoveryPlansGenerated >= 5)  unlocked.push('recovery_5')
  if (stats.level >= 5)                   unlocked.push('level_5')
  if (stats.level >= 10)                  unlocked.push('level_10')

  return unlocked
}

// ── Streak helpers ────────────────────────────────────────────────────────────

/** Longest streak of consecutive days in a list of 'yyyy-MM-dd' dates */
export function calculateLongestStreak(sessionDates: string[]): number {
  if (sessionDates.length === 0) return 0
  const unique = [...new Set(sessionDates)].sort()
  let longest = 1
  let current = 1
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + 'T12:00:00')
    const curr = new Date(unique[i] + 'T12:00:00')
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diffDays === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }
  return longest
}
