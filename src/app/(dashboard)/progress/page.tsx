import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SubjectProgressEditor } from '@/components/dashboard/subject-progress-editor'
import { SessionHistory } from '@/components/dashboard/session-history'
import { Card, CardContent } from '@/components/ui/card'
import type { SubjectProgress } from '@/lib/types'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rawProgress }, { data: rawSessions }] = await Promise.all([
    supabase.from('subject_progress').select('subject, progress').eq('user_id', user.id),
    supabase
      .from('study_sessions')
      .select('id, subject, duration_minutes, date, confidence, productivity, notes')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const subjects: SubjectProgress[] = (rawProgress ?? []).map((sp) => ({
    subject: sp.subject,
    progress: sp.progress,
  }))

  const totalMinutes = (rawSessions ?? []).reduce((sum, s) => sum + s.duration_minutes, 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Progress</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update your subject confidence and review your study history.
        </p>
      </div>

      <div className="space-y-6">
        <SubjectProgressEditor initialSubjects={subjects} />

        <Card>
          <CardContent className="pt-6">
            <SessionHistory
              sessions={rawSessions ?? []}
              totalHours={totalHours}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
