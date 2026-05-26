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
import type { StudyTask, SubjectProgress, WeakTopic } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const _now = new Date()
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`

  // Fetch all dashboard data in parallel
  const [
    { data: profile },
    { data: rawTasks },
    { data: rawProgress },
    { data: rawWeakTopics },
    { data: rawSessions },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('study_tasks').select('*').eq('user_id', user.id).eq('date', today).order('created_at'),
    supabase.from('subject_progress').select('*').eq('user_id', user.id),
    supabase.from('weak_topics').select('*').eq('user_id', user.id).eq('resolved', false).order('created_at', { ascending: false }),
    supabase.from('study_sessions').select('date, duration_minutes').eq('user_id', user.id).order('date', { ascending: false }),
  ])

  // Streak
  const streakDays = calculateStreak((rawSessions ?? []).map((s) => s.date))

  // Weekly hours (Mon–Sun)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weeklyMinutes = (rawSessions ?? [])
    .filter((s) => new Date(s.date + 'T12:00:00') >= weekStart)
    .reduce((sum, s) => sum + s.duration_minutes, 0)
  const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10

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

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StreakCard streakDays={streakDays} longestStreak={streakDays} />
        <CountdownCard examDate={profile?.exam_date ?? null} />
        <WeeklyHoursCard
          completedHours={weeklyHours}
          goalHours={profile?.weekly_hours_goal ?? 30}
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
