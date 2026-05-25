import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, subDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Count consecutive study days ending today or yesterday (streak still active)
export function calculateStreak(sessionDates: string[]): number {
  if (sessionDates.length === 0) return 0

  const unique = [...new Set(sessionDates)].sort().reverse()
  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  // Streak is broken if no session today or yesterday
  if (unique[0] !== today && unique[0] !== yesterday) return 0

  let streak = 0
  let expected = unique[0]

  for (const date of unique) {
    if (date === expected) {
      streak++
      expected = format(subDays(new Date(expected + 'T12:00:00'), 1), 'yyyy-MM-dd')
    } else {
      break
    }
  }

  return streak
}
