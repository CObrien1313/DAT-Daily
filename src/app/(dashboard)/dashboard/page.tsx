import { redirect } from 'next/navigation'
import { startOfWeek } from 'date-fns'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateStreak } from '@/lib/utils'
import { CountdownCard } from '@/components/dashboard/countdown-card'
import { StreakCard } from '@/components/dashboard/streak-card'
import { WeeklyHoursCard } from '@/components/dashboard/weekly-hours-card'
import { TaskList } from '@/components/dashboard/task-list'
import { SubjectProgressCard } from '@/components/dashboard/subject-progress-card'
import { WeakTopicsCard } from '@/components/dashboard/weak-topics-card'
import { LogSessionModal } from '@/components/dashboard/log-session-modal'
import { DashboardGreeting } from '@/components/dashboard/dashboard-greeting'
import { DailyQuestionStreakCard } from '@/components/dashboard/daily-question-streak-card'
import { getQuestionDate, calcQuestionStreak } from '@/lib/question-date'
import type { StudyTask, SubjectProgress, WeakTopic } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check onboarding first
  const { data: profileCheck } = await supabase.from('profiles').select('onboarded').eq('id', user.id).single()
  // Only redirect truly new users (onboarded is explicitly false, not null)
  if (profileCheck?.onboarded === false) redirect('/onboarding')

  const _now = new Date()
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`
  const questionDate = getQuestionDate()

  // Fetch all dashboard data in parallel
  const [
    { data: profile },
    { data: rawTasks },
    { data: rawProgress },
    { data: rawWeakTopics },
    { data: rawSessions },
    { data: allAnswers },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('study_tasks').select('*').eq('user_id', user.id).eq('date', today).order('created_at'),
    supabase.from('subject_progress').select('*').eq('user_id', user.id),
    supabase.from('weak_topics').select('*').eq('user_id', user.id).eq('resolved', false).order('created_at', { ascending: false }),
    supabase.from('study_sessions').select('date, duration_minutes').eq('user_id', user.id).order('date', { ascending: false }),
    supabase.from('daily_question_answers').select('question_date, is_correct').eq('user_id', user.id),
  ])

  // Streak
  const streakDays = calculateStreak((rawSessions ?? []).map((s) => s.date))

  // Daily question stats
  const answeredDates = (allAnswers ?? []).map((a) => a.question_date)
  const questionStreak = calcQuestionStreak(answeredDates, questionDate)
  const totalCorrect = (allAnswers ?? []).filter((a) => a.is_correct).length
  const totalWrong = (allAnswers ?? []).filter((a) => !a.is_correct).length

  // Weekly hours (Mon–Sun)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const thisWeekSessions = (rawSessions ?? []).filter(
    (s) => new Date(s.date + 'T12:00:00') >= weekStart
  )
  const weeklyMinutes = thisWeekSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10
  const weeklySessionCount = thisWeekSessions.length
  const weeklyGoal = profile?.weekly_hours_goal ?? 30
  const weeklyPct = Math.min(100, Math.round((weeklyHours / weeklyGoal) * 100))

  // Shape data for components
  const tasks: StudyTask[] = (rawTasks ?? []).map((t) => ({
    id: t.id,
    userId: t.user_id,
    title: t.title,
    subject: t.subject,
    completed: t.completed,
    date: t.date,
    estimatedMinutes: t.estimated_minutes,
  }))

  const subjects: SubjectProgress[] = (rawProgress ?? []).map((sp) => ({
    subject: sp.subject,
    progress: sp.progress,
  }))

  const weakTopics: WeakTopic[] = (rawWeakTopics ?? []).map((wt) => ({
    id: wt.id,
    subject: wt.subject,
    topic: wt.topic,
    priority: wt.priority,
  }))

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <DashboardGreeting name={profile?.name ?? 'there'} />
        <LogSessionModal />
      </div>

      {/* Onboarding nudge — shown until exam date is set */}
      {!profile?.exam_date && (
        <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-indigo-900">Set your exam date</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Add your DAT date and weekly study goal to unlock the full dashboard.
            </p>
          </div>
          <Link
            href="/settings"
            className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline"
          >
            Go to Settings →
          </Link>
        </div>
      )}

      {/* Weekly summary banner — only show if sessions logged this week */}
      {weeklySessionCount > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl text-white">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold opacity-90">This week</p>
              <p className="text-xl font-bold mt-0.5">
                {weeklyHours}h studied across {weeklySessionCount} session{weeklySessionCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">{weeklyPct}% of your {weeklyGoal}h goal</p>
              <div className="mt-1.5 h-2 w-32 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${weeklyPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StreakCard streakDays={streakDays} longestStreak={streakDays} />
        <CountdownCard examDate={profile?.exam_date ?? null} />
        <WeeklyHoursCard
          completedHours={weeklyHours}
          goalHours={profile?.weekly_hours_goal ?? 30}
        />
        <DailyQuestionStreakCard
          questionStreak={questionStreak}
          totalCorrect={totalCorrect}
          totalWrong={totalWrong}
        />
      </div>

      {/* Tasks + Subject progress */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <div className="lg:col-span-3">
          <TaskList initialTasks={tasks} />
        </div>
        <div className="lg:col-span-2">
          <SubjectProgressCard subjects={subjects} />
        </div>
      </div>

      {/* Weak topics */}
      <WeakTopicsCard initialTopics={weakTopics} />
    </div>
  )
}
