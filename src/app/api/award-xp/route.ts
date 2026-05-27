import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  calculateXP,
  getLevelFromXP,
  checkAchievements,
  calculateLongestStreak,
  ACHIEVEMENTS,
  type XPAction,
  type AchievementStats,
} from '@/lib/gamification'
import { calculateStreak } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { action: XPAction }
    const { action } = body
    if (!action?.type) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    // ── Fetch all stats needed for XP calculation + achievement check ─────────

    const [
      { data: profile },
      { data: sessions },
      { data: tasks },
      { data: answers },
      { data: recoveryPlans },
      { data: existingAchievements },
    ] = await Promise.all([
      supabase.from('profiles').select('xp, level').eq('id', user.id).single(),
      supabase.from('study_sessions').select('date, duration_minutes, subject').eq('user_id', user.id),
      supabase.from('study_tasks').select('completed').eq('user_id', user.id),
      supabase.from('daily_question_answers').select('is_correct').eq('user_id', user.id),
      supabase.from('recovery_plans').select('id').eq('user_id', user.id),
      supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id),
    ])

    const currentXP: number = profile?.xp ?? 0
    const oldLevel = getLevelFromXP(currentXP)

    // Compute current streak for streak bonus on LOG_SESSION
    const sessionDates = (sessions ?? []).map((s) => s.date)
    const currentStreak = action.type === 'LOG_SESSION'
      ? calculateStreak(sessionDates)
      : 0

    // Calculate XP earned
    const xpEarned = calculateXP(action, currentStreak)
    const newXP = currentXP + xpEarned
    const newLevel = getLevelFromXP(newXP)
    const leveledUp = newLevel.level > oldLevel.level

    // ── Achievement stats ─────────────────────────────────────────────────────

    const allDurations = (sessions ?? []).map((s) => s.duration_minutes)
    const totalHours = allDurations.reduce((s, m) => s + m, 0) / 60
    const singleSessionMaxMinutes = allDurations.length > 0 ? Math.max(...allDurations) : 0
    const longestStreak = calculateLongestStreak(sessionDates)
    const uniqueSubjects = new Set((sessions ?? []).map((s) => s.subject)).size
    const totalTasksCompleted = (tasks ?? []).filter((t) => t.completed).length
    const dailyQuestionsAnswered = (answers ?? []).length
    const dailyQuestionsCorrect = (answers ?? []).filter((a) => a.is_correct).length
    const recoveryPlansGenerated = (recoveryPlans ?? []).length

    const stats: AchievementStats = {
      totalSessions: (sessions ?? []).length,
      totalHours,
      longestStreak,
      totalTasksCompleted,
      dailyQuestionsAnswered,
      dailyQuestionsCorrect,
      recoveryPlansGenerated,
      subjectsStudied: uniqueSubjects,
      singleSessionMaxMinutes,
      level: newLevel.level,
    }

    // Determine which achievements are newly unlocked
    const alreadyEarned = new Set((existingAchievements ?? []).map((a) => a.achievement_id))
    const nowUnlocked = checkAchievements(stats)
    const brandNew = nowUnlocked.filter((id) => !alreadyEarned.has(id))

    // ── Persist ───────────────────────────────────────────────────────────────

    await supabase
      .from('profiles')
      .update({ xp: newXP, level: newLevel.level })
      .eq('id', user.id)

    if (brandNew.length > 0) {
      await supabase.from('user_achievements').insert(
        brandNew.map((achievement_id) => ({ user_id: user.id, achievement_id }))
      )
    }

    // Resolve full achievement objects for newly earned ones
    const newAchievements = ACHIEVEMENTS.filter((a) => brandNew.includes(a.id))

    return NextResponse.json({
      xpEarned,
      newXP,
      oldLevel: oldLevel.level,
      newLevel: newLevel.level,
      leveledUp,
      newLevelTitle: newLevel.title,
      newAchievements,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
