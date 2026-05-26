/**
 * Returns the current "question date" — the calendar date (yyyy-MM-dd, in ET)
 * of the question that should be shown right now.
 *
 * Questions change at 8:00 AM US Eastern time every day.
 * Before 8 AM ET  → show the previous day's question.
 * At/after 8 AM ET → show today's question.
 */
export function getQuestionDate(): string {
  try {
    const now = new Date()

    // Get individual date/time parts in Eastern time
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      hour12: false,
    })

    const parts = fmt.formatToParts(now)
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''

    const hour = parseInt(get('hour'), 10)
    const todayET = `${get('year')}-${get('month')}-${get('day')}`

    if (hour < 8) {
      // Before 8 AM — use yesterday's ET date
      const fmt2 = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const p2 = fmt2.formatToParts(yesterday)
      const g2 = (type: string) => p2.find((p) => p.type === type)?.value ?? ''
      return `${g2('year')}-${g2('month')}-${g2('day')}`
    }

    return todayET
  } catch {
    // Fallback: UTC date
    return new Date().toISOString().split('T')[0]
  }
}

/** Calculates the streak of consecutive days on which the user answered a question. */
export function calcQuestionStreak(
  answeredDates: string[],
  questionDate: string
): number {
  if (answeredDates.length === 0) return 0

  const unique = [...new Set(answeredDates)].sort().reverse()

  // Streak is only "alive" if the user has answered today's OR yesterday's question
  const prevDay = (date: string) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  if (unique[0] !== questionDate && unique[0] !== prevDay(questionDate)) return 0

  let streak = 1
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + 'T12:00:00')
    const curr = new Date(unique[i] + 'T12:00:00')
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diff === 1) streak++
    else break
  }
  return streak
}
