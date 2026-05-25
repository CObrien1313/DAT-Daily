'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Loader2, Sparkles, Clock, BookOpen, Lightbulb, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { DAT_SUBJECTS, SUBJECT_COLORS } from '@/lib/types'
import type { DATSubject, SubjectProgress } from '@/lib/types'

interface ScheduleTask {
  subject: DATSubject
  topic: string
  durationMinutes: number
  description: string
}

interface DayPlan {
  day: string
  totalMinutes: number
  tasks: ScheduleTask[]
}

interface GeneratedSchedule {
  weeklyTip: string
  prioritySubjects: string[]
  weeklyPlan: DayPlan[]
}

interface RecentSession {
  subject: string
  duration_minutes: number
  date: string
  confidence: number | null
  productivity: number | null
}

interface ScheduleGeneratorProps {
  examDate: string | null
  weeklyHours: number
  subjectProgress: SubjectProgress[]
  weekStart: string
  existingSchedule: GeneratedSchedule | null
  generatedAt: string | null
  recentSessions: RecentSession[]
}

const SUBJECT_BADGE_VARIANT: Record<DATSubject, 'default' | 'success' | 'info' | 'warning'> = {
  Biology: 'success',
  'General Chemistry': 'info',
  'Organic Chemistry': 'default',
  PAT: 'warning',
  'Reading Comprehension': 'info',
  'Quantitative Reasoning': 'default',
}

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function DayCard({ day }: { day: DayPlan }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800 text-sm w-24">{day.day}</span>
          {day.totalMinutes > 0 ? (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {formatMinutes(day.totalMinutes)}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">Rest day</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && day.tasks.length > 0 && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {day.tasks.map((task, i) => (
            <li key={i} className="px-4 py-3 bg-white flex gap-3">
              <div className={cn('mt-1 w-2 h-2 rounded-full flex-shrink-0', SUBJECT_COLORS[task.subject] ?? 'bg-slate-400')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={SUBJECT_BADGE_VARIANT[task.subject] ?? 'default'} className="text-xs">
                    {task.subject}
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium">{task.topic}</span>
                  <span className="ml-auto text-xs text-slate-400 flex-shrink-0">{formatMinutes(task.durationMinutes)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{task.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && day.tasks.length === 0 && (
        <p className="px-4 py-3 text-sm text-slate-400 italic border-t border-slate-100 bg-white">
          Rest and recovery — no study tasks scheduled.
        </p>
      )}
    </div>
  )
}

export function ScheduleGenerator({
  examDate,
  weeklyHours,
  subjectProgress,
  weekStart,
  existingSchedule,
  generatedAt,
  recentSessions,
}: ScheduleGeneratorProps) {
  const [weakSubjects, setWeakSubjects] = useState<DATSubject[]>([])
  const [notes, setNotes] = useState('')
  const [showRegenForm, setShowRegenForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(existingSchedule)
  const [savedAt, setSavedAt] = useState<string | null>(generatedAt)
  const [error, setError] = useState<string | null>(null)

  const daysUntilExam = examDate
    ? Math.max(0, Math.ceil((new Date(examDate + 'T12:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const hasSchedule = schedule !== null

  function toggleSubject(subject: DATSubject) {
    setWeakSubjects((prev) => prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject])
  }

  async function generate() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examDate, weeklyHours, weakSubjects, subjectProgress, recentSessions, notes: notes.trim() || undefined }),
      })

      let data: GeneratedSchedule & { error?: string }
      try {
        data = await res.json()
      } catch {
        setError('The server took too long to respond. Please try again.')
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Save to Supabase
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('study_schedules').upsert(
          { user_id: user.id, week_start: weekStart, schedule: data, created_at: new Date().toISOString() },
          { onConflict: 'user_id,week_start' }
        )
      }

      setSchedule(data)
      setSavedAt(new Date().toISOString())
      setShowRegenForm(false)
      setNotes('')
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Config / regen card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <CardTitle>AI Study Schedule</CardTitle>
          </div>
          {savedAt && (
            <p className="text-xs text-slate-400 mt-1">
              Generated {format(parseISO(savedAt), 'MMM d, yyyy')} · saved for this week
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Snapshot row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-slate-700">
                {daysUntilExam !== null
                  ? <><span className="font-semibold">{daysUntilExam}</span> days until exam</>
                  : <span className="text-slate-400">No exam date set</span>}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-slate-700"><span className="font-semibold">{weeklyHours}h</span> / week goal</span>
            </div>
          </div>

          {/* First-time generate OR regen toggle */}
          {!hasSchedule && !showRegenForm && (
            <>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Mark your weak areas <span className="font-normal text-slate-400">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {DAT_SUBJECTS.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                        weakSubjects.includes(subject)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                      )}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <Button onClick={generate} disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4" />Generate Schedule</>}
              </Button>
            </>
          )}

          {hasSchedule && !showRegenForm && (
            <Button variant="secondary" size="sm" onClick={() => setShowRegenForm(true)}>
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate Schedule
            </Button>
          )}

          {/* Regen form */}
          {showRegenForm && (
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Mark weak areas</p>
                <div className="flex flex-wrap gap-2">
                  {DAT_SUBJECTS.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                        weakSubjects.includes(subject)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                      )}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Custom instructions <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. More focus on organic chemistry mechanisms, lighter weekend, include practice tests…"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={generate} disabled={loading} size="sm">
                  {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</> : <><Sparkles className="w-3.5 h-3.5" />Generate</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowRegenForm(false); setNotes(''); setError(null) }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule display */}
      {schedule && (
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1">This week&apos;s tip</p>
              <p className="text-sm text-amber-900">{schedule.weeklyTip}</p>
            </div>
          </div>

          {schedule.prioritySubjects?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-500">Priority this week:</span>
              {schedule.prioritySubjects.map((s) => (
                <Badge key={s} variant={SUBJECT_BADGE_VARIANT[s as DATSubject] ?? 'default'}>{s}</Badge>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {schedule.weeklyPlan.map((day) => (
              <DayCard key={day.day} day={day} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
