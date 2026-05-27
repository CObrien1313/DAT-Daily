import { redirect } from 'next/navigation'
import { startOfWeek, addDays, subWeeks, format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Clock, TrendingUp, CalendarDays, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUBJECT_COLORS } from '@/lib/types'
import type { DATSubject } from '@/lib/types'
import { WeeklyHoursChart } from '@/components/dashboard/charts/weekly-hours-chart'
import { ConfidenceChart } from '@/components/dashboard/charts/confidence-chart'
import { StreakCalendar } from '@/components/dashboard/charts/streak-calendar'
import { SubjectHeatmap } from '@/components/dashboard/charts/subject-heatmap'
import { PredictedScoreCard } from '@/components/dashboard/charts/predicted-score-card'

const DAT_SUBJECTS: DATSubject[] = [
  'Biology',
  'General Chemistry',
  'Organic Chemistry',
  'PAT',
  'Reading Comprehension',
  'Quantitative Reasoning',
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Session {
  subject: string
  duration_minutes: number
  date: string
  confidence: number | null
  productivity: number | null
}

function localStreak(dates: string[]): number {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const yesterday = format(addDays(new Date(today + 'T12:00:00'), -1), 'yyyy-MM-dd')

  const unique = [...new Set(dates)].sort().reverse()
  if (unique.length === 0) return 0
  if (unique[0] !== today && unique[0] !== yesterday) return 0

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

function StatCard({
  icon, label, value, sub, bg,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string; bg: string
}) {
  return (
    <div className={cn('rounded-xl p-4 border border-slate-100', bg)}>
      <div className="mb-2">{icon}</div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function InsightRow({ emoji, children, warn }: { emoji: string; children: React.ReactNode; warn?: boolean }) {
  return (
    <div className={cn(
      'flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm',
      warn ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-slate-700 bg-slate-50 border-slate-100'
    )}>
      <span className="flex-shrink-0 leading-5">{emoji}</span>
      <span className="leading-5">{children}</span>
    </div>
  )
}

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: rawSessions }] = await Promise.all([
    supabase
      .from('profiles')
      .select('exam_date, weekly_hours_goal, target_score')
      .eq('id', user.id)
      .single(),
    supabase
      .from('study_sessions')
      .select('subject, duration_minutes, date, confidence, productivity')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
  ])

  const sessions: Session[] = rawSessions ?? []
  const weeklyGoal = profile?.weekly_hours_goal ?? 20
  const targetScore: number = profile?.target_score ?? 20
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // ── Core stats ──────────────────────────────────────────────────────────────
  const streak = localStreak(sessions.map((s) => s.date))
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10

  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const thisWeekMinutes = sessions.filter((s) => s.date >= weekStart).reduce((sum, s) => sum + s.duration_minutes, 0)
  const thisWeekHours = Math.round((thisWeekMinutes / 60) * 10) / 10

  const daysUntilExam = profile?.exam_date
    ? Math.max(0, Math.ceil((new Date(profile.exam_date + 'T12:00:00').getTime() - now.getTime()) / 86400000))
    : null

  const projectedHours = daysUntilExam !== null
    ? Math.round((totalHours + (daysUntilExam / 7) * weeklyGoal) * 10) / 10
    : null

  // ── Per-subject aggregates ──────────────────────────────────────────────────
  const minutesBySubject: Record<string, number> = {}
  for (const s of sessions) minutesBySubject[s.subject] = (minutesBySubject[s.subject] ?? 0) + s.duration_minutes
  const maxSubjectMinutes = Math.max(1, ...Object.values(minutesBySubject))

  const confBySubject: Record<string, number[]> = {}
  for (const s of sessions) {
    if (s.confidence) {
      if (!confBySubject[s.subject]) confBySubject[s.subject] = []
      confBySubject[s.subject].push(s.confidence)
    }
  }
  const avgConf: Record<string, number> = {}
  for (const [subj, scores] of Object.entries(confBySubject))
    avgConf[subj] = scores.reduce((a, b) => a + b, 0) / scores.length

  const subjectsWithConf = Object.keys(avgConf)
  const strongestSubject = subjectsWithConf.length > 0 ? subjectsWithConf.reduce((a, b) => avgConf[a] >= avgConf[b] ? a : b) : null
  const weakestSubject = subjectsWithConf.length > 1 ? subjectsWithConf.reduce((a, b) => avgConf[a] <= avgConf[b] ? a : b) : null

  const minutesByDay: number[] = Array(7).fill(0)
  for (const s of sessions) minutesByDay[new Date(s.date + 'T12:00:00').getDay()] += s.duration_minutes
  const bestDayIdx = minutesByDay.indexOf(Math.max(...minutesByDay))

  const lastStudied: Record<string, string> = {}
  for (const s of sessions) if (!lastStudied[s.subject]) lastStudied[s.subject] = s.date
  const unstudiedSubjects = DAT_SUBJECTS.filter((subj) => !lastStudied[subj])
  const longestGap = DAT_SUBJECTS.filter((s) => lastStudied[s])
    .map((subj) => ({
      subject: subj,
      days: Math.round((new Date(todayStr + 'T12:00:00').getTime() - new Date(lastStudied[subj] + 'T12:00:00').getTime()) / 86400000),
    }))
    .sort((a, b) => b.days - a.days)[0]

  // ── Weekly hours chart data (last 10 weeks) ─────────────────────────────────
  const weeklyHoursData: { week: string; hours: number }[] = []
  for (let i = 9; i >= 0; i--) {
    const wStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const wEnd = addDays(wStart, 6)
    const wStartStr = format(wStart, 'yyyy-MM-dd')
    const wEndStr = format(wEnd, 'yyyy-MM-dd')
    const mins = sessions.filter((s) => s.date >= wStartStr && s.date <= wEndStr).reduce((sum, s) => sum + s.duration_minutes, 0)
    weeklyHoursData.push({ week: format(wStart, 'MMM d'), hours: Math.round((mins / 60) * 10) / 10 })
  }

  // ── Streak calendar (13 weeks = 91 days starting from Mon 12 weeks ago) ─────
  const calendarStart = startOfWeek(subWeeks(now, 12), { weekStartsOn: 1 })
  const dayMap: Record<string, number> = {}
  for (const s of sessions) dayMap[s.date] = (dayMap[s.date] ?? 0) + s.duration_minutes
  const calendarDays: { date: string; minutes: number; isFuture: boolean }[] = []
  for (let i = 0; i < 91; i++) {
    const d = addDays(calendarStart, i)
    const dateStr = format(d, 'yyyy-MM-dd')
    calendarDays.push({ date: dateStr, minutes: dayMap[dateStr] ?? 0, isFuture: dateStr > todayStr })
  }

  // ── Confidence over time (last 10 weeks) ────────────────────────────────────
  const weeklyConfData: { week: string; avg: number | null }[] = []
  for (let i = 9; i >= 0; i--) {
    const wStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const wEnd = addDays(wStart, 6)
    const wStartStr = format(wStart, 'yyyy-MM-dd')
    const wEndStr = format(wEnd, 'yyyy-MM-dd')
    const withConf = sessions.filter((s) => s.date >= wStartStr && s.date <= wEndStr && s.confidence)
    const avg = withConf.length > 0 ? withConf.reduce((sum, s) => sum + (s.confidence ?? 0), 0) / withConf.length : null
    weeklyConfData.push({ week: format(wStart, 'MMM d'), avg: avg !== null ? Math.round(avg * 10) / 10 : null })
  }

  // ── Subject heatmap (last 8 weeks) ──────────────────────────────────────────
  const heatmapWeeks: string[] = []
  const heatmapRows: { subject: string; cells: number[] }[] = DAT_SUBJECTS.map((s) => ({ subject: s, cells: [] }))
  for (let i = 7; i >= 0; i--) {
    const wStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
    const wEnd = addDays(wStart, 6)
    const wStartStr = format(wStart, 'yyyy-MM-dd')
    const wEndStr = format(wEnd, 'yyyy-MM-dd')
    heatmapWeeks.push(format(wStart, 'MMM d'))
    for (const row of heatmapRows) {
      const mins = sessions.filter((s) => s.subject === row.subject && s.date >= wStartStr && s.date <= wEndStr).reduce((sum, s) => sum + s.duration_minutes, 0)
      row.cells.push(Math.round((mins / 60) * 10) / 10)
    }
  }

  // ── Predicted score ─────────────────────────────────────────────────────────
  const sessionsWithConf = sessions.filter((s) => s.confidence)
  const avgOverallConf = sessionsWithConf.length > 0
    ? sessionsWithConf.reduce((sum, s) => sum + (s.confidence ?? 0), 0) / sessionsWithConf.length
    : null
  const subjectsCovered = Object.keys(minutesBySubject).length
  const hoursBonus = Math.min(8, (totalHours / 400) * 8)
  const confBonus = avgOverallConf ? (avgOverallConf - 3) * 0.5 : 0
  const diversityBonus = (subjectsCovered / DAT_SUBJECTS.length)
  const predictedScore = Math.min(30, Math.max(17, Math.round((17 + hoursBonus + confBonus + diversityBonus) * 10) / 10))

  const hasAnyData = sessions.length > 0

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
        <p className="text-sm text-slate-500 mt-1">A look at your study patterns and performance.</p>
      </div>

      {!hasAnyData ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-slate-400 text-sm">Log some study sessions to see your insights here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">

          {/* ── Stat chips ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Flame className="w-5 h-5 text-orange-500" />} label="Study streak" value={`${streak} day${streak !== 1 ? 's' : ''}`} bg="bg-orange-50" />
            <StatCard icon={<Clock className="w-5 h-5 text-indigo-500" />} label="Total logged" value={`${totalHours}h`} bg="bg-indigo-50" />
            <StatCard icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} label="This week" value={`${thisWeekHours}h`} sub={`goal: ${weeklyGoal}h`} bg="bg-emerald-50" />
            <StatCard icon={<CalendarDays className="w-5 h-5 text-sky-500" />} label="Days until exam" value={daysUntilExam !== null ? `${daysUntilExam}` : '—'} sub={daysUntilExam === null ? 'Set in settings' : undefined} bg="bg-sky-50" />
          </div>

          {/* ── Predicted Score ────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Predicted DAT Score</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <PredictedScoreCard
                predictedScore={predictedScore}
                targetScore={targetScore}
                totalHours={totalHours}
                avgConfidence={avgOverallConf !== null ? Math.round(avgOverallConf * 10) / 10 : null}
                subjectsCovered={subjectsCovered}
                totalSubjects={DAT_SUBJECTS.length}
              />
            </CardContent>
          </Card>

          {/* ── Streak Calendar ────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Study Calendar</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <StreakCalendar days={calendarDays} />
            </CardContent>
          </Card>

          {/* ── Weekly Hours Chart ─────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Weekly Study Hours</CardTitle>
                <span className="text-xs text-slate-400">Goal: {weeklyGoal}h/week (darker = met goal)</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <WeeklyHoursChart data={weeklyHoursData} goalHours={weeklyGoal} />
            </CardContent>
          </Card>

          {/* ── Confidence Over Time ───────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Confidence Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ConfidenceChart data={weeklyConfData} />
            </CardContent>
          </Card>

          {/* ── Subject Heatmap ────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Heatmap</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <SubjectHeatmap weekLabels={heatmapWeeks} rows={heatmapRows} />
            </CardContent>
          </Card>

          {/* ── Smart insights ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader><CardTitle>Your Patterns</CardTitle></CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              {strongestSubject && (
                <InsightRow emoji="💪">
                  Your strongest subject is <strong>{strongestSubject}</strong> (avg confidence {avgConf[strongestSubject].toFixed(1)}/5)
                </InsightRow>
              )}
              {weakestSubject && (
                <InsightRow emoji="📌" warn>
                  Focus more on <strong>{weakestSubject}</strong> — lowest confidence ({avgConf[weakestSubject].toFixed(1)}/5)
                </InsightRow>
              )}
              {minutesByDay[bestDayIdx] > 0 && (
                <InsightRow emoji="📅">
                  You study most on <strong>{DAYS_OF_WEEK[bestDayIdx]}s</strong> ({Math.round((minutesByDay[bestDayIdx] / 60) * 10) / 10}h total)
                </InsightRow>
              )}
              {projectedHours !== null && (
                <InsightRow emoji="🎯">
                  At your current pace you&apos;ll log <strong>~{projectedHours}h</strong> before your exam
                </InsightRow>
              )}
              {unstudiedSubjects.length > 0 && (
                <InsightRow emoji="⚠️" warn>
                  You haven&apos;t studied <strong>{unstudiedSubjects.join(', ')}</strong> yet
                </InsightRow>
              )}
              {longestGap && longestGap.days > 7 && (
                <InsightRow emoji="⏰" warn>
                  <strong>{longestGap.subject}</strong> hasn&apos;t been studied in {longestGap.days} days
                </InsightRow>
              )}
            </CardContent>
          </Card>

          {/* ── Time by subject ────────────────────────────────────────────── */}
          <Card>
            <CardHeader><CardTitle>Time by Subject</CardTitle></CardHeader>
            <CardContent className="space-y-3.5 pt-0">
              {DAT_SUBJECTS.map((subject) => {
                const mins = minutesBySubject[subject] ?? 0
                const pct = Math.round((mins / maxSubjectMinutes) * 100)
                const hrs = Math.round((mins / 60) * 10) / 10
                return (
                  <div key={subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-700">{subject}</span>
                      <span className="text-xs text-slate-400">{hrs}h</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', SUBJECT_COLORS[subject] ?? 'bg-slate-400')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* ── Confidence by subject ──────────────────────────────────────── */}
          {subjectsWithConf.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Confidence by Subject</CardTitle></CardHeader>
              <CardContent className="space-y-3 pt-0">
                {DAT_SUBJECTS.filter((s) => avgConf[s] !== undefined).map((subject) => {
                  const score = avgConf[subject]
                  return (
                    <div key={subject} className="flex items-center gap-3">
                      <span className="text-sm text-slate-700 w-48 flex-shrink-0 truncate">{subject}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('w-4 h-4', i < Math.round(score) ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">{score.toFixed(1)}/5</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </div>
  )
}
