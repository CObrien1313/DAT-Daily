import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { SubjectProgressEditor } from '@/components/dashboard/subject-progress-editor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SubjectProgress, DATSubject } from '@/lib/types'

const SUBJECT_BADGE_VARIANT: Record<DATSubject, 'default' | 'success' | 'info' | 'warning'> = {
  Biology: 'success',
  'General Chemistry': 'info',
  'Organic Chemistry': 'default',
  PAT: 'warning',
  'Reading Comprehension': 'info',
  'Quantitative Reasoning': 'default',
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rawProgress }, { data: rawSessions }] = await Promise.all([
    supabase.from('subject_progress').select('subject, progress').eq('user_id', user.id),
    supabase
      .from('study_sessions')
      .select('id, subject, duration_minutes, date')
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

        {/* Session history */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Study History</CardTitle>
              <span className="text-sm text-slate-500 font-normal">
                {totalHours}h logged total
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {(rawSessions ?? []).length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No sessions logged yet. Use the &quot;Log Session&quot; button on your dashboard!
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(rawSessions ?? []).map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={SUBJECT_BADGE_VARIANT[s.subject as DATSubject] ?? 'default'}>
                        {s.subject}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {format(parseISO(s.date + 'T12:00:00'), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {s.duration_minutes}m
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
