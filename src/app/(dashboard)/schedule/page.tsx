import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScheduleGenerator } from '@/components/dashboard/schedule-generator'
import type { SubjectProgress } from '@/lib/types'

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: rawProgress }] = await Promise.all([
    supabase.from('profiles').select('exam_date, weekly_hours_goal').eq('id', user.id).single(),
    supabase.from('subject_progress').select('subject, progress').eq('user_id', user.id),
  ])

  const subjectProgress: SubjectProgress[] = (rawProgress ?? []).map((sp) => ({
    subject: sp.subject,
    progress: sp.progress,
  }))

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Study Schedule</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate a personalized weekly plan powered by AI.
        </p>
      </div>
      <ScheduleGenerator
        examDate={profile?.exam_date ?? null}
        weeklyHours={profile?.weekly_hours_goal ?? 30}
        subjectProgress={subjectProgress}
      />
    </div>
  )
}
