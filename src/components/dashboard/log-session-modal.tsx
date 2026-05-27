'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, CheckCircle2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { DAT_SUBJECTS } from '@/lib/types'
import type { DATSubject } from '@/lib/types'
import { useXP } from '@/contexts/xp-context'

const DURATION_PRESETS = [25, 45, 60, 90]

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'w-6 h-6 transition-colors',
                star <= (hovered || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-200'
              )}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-1 text-xs text-slate-400 self-center">
            {value}/5
          </span>
        )}
      </div>
    </div>
  )
}

export function LogSessionModal() {
  const router = useRouter()
  const { awardXP } = useXP()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState<DATSubject>('Biology')
  const [minutes, setMinutes] = useState(60)
  const [customMinutes, setCustomMinutes] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [confidence, setConfidence] = useState(0)
  const [productivity, setProductivity] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [milestone, setMilestone] = useState<string | null>(null)

  const effectiveMinutes = useCustom ? Number(customMinutes) || 0 : minutes

  function handleOpen() {
    setSaved(false)
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setSubject('Biology')
    setMinutes(60)
    setCustomMinutes('')
    setUseCustom(false)
    setDate(new Date().toISOString().split('T')[0])
    setConfidence(0)
    setProductivity(0)
    setNotes('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (effectiveMinutes < 1) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    await supabase.from('study_sessions').insert({
      user_id: user.id,
      subject,
      duration_minutes: effectiveMinutes,
      date,
      confidence: confidence || null,
      productivity: productivity || null,
      notes: notes.trim() || null,
    })

    // Bump subject progress: +1% per 30 min, min 1%, cap at 100
    const gain = Math.max(1, Math.round(effectiveMinutes / 30))
    const { data: current } = await supabase
      .from('subject_progress')
      .select('progress')
      .eq('user_id', user.id)
      .eq('subject', subject)
      .single()

    if (current) {
      const newProgress = Math.min(100, current.progress + gain)
      await supabase
        .from('subject_progress')
        .update({ progress: newProgress })
        .eq('user_id', user.id)
        .eq('subject', subject)
    }

    // Check for total-hours milestones
    const { data: allSessions } = await supabase
      .from('study_sessions')
      .select('duration_minutes')
      .eq('user_id', user.id)
    const totalMins = (allSessions ?? []).reduce((s, r) => s + r.duration_minutes, 0)
    const totalHours = totalMins / 60
    const MILESTONES = [
      { hours: 1,   msg: '🎉 First hour logged! Your journey begins.' },
      { hours: 10,  msg: '⚡ 10 hours down! You\'re building real momentum.' },
      { hours: 25,  msg: '🔥 25 hours! A quarter of the way to exam-ready.' },
      { hours: 50,  msg: '🏅 50 hours of studying — incredible dedication!' },
      { hours: 100, msg: '🏆 100 hours! You\'re in elite prep territory.' },
      { hours: 200, msg: '🚀 200 hours! You\'re basically a DAT machine.' },
    ]
    const prevHours = (totalMins - effectiveMinutes) / 60
    const hit = MILESTONES.find((m) => prevHours < m.hours && totalHours >= m.hours)
    if (hit) setMilestone(hit.msg)

    setSaving(false)
    setSaved(true)

    // Award XP (fire-and-forget — after session is in DB)
    awardXP({ type: 'LOG_SESSION', minutes: effectiveMinutes })

    router.refresh()
    if (!hit) setTimeout(() => handleClose(), 800)
  }

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white'

  return (
    <>
      <Button onClick={handleOpen} size="sm">
        <Plus className="w-3.5 h-3.5" />
        Log Session
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Log Study Session</h2>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as DATSubject)}
                  className={inputClass}
                >
                  {DAT_SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                <div className="flex gap-2 mb-2.5">
                  {DURATION_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setMinutes(p); setUseCustom(false) }}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                        !useCustom && minutes === p
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                      )}
                    >
                      {p}m
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Custom (min)"
                    value={customMinutes}
                    min={1}
                    max={480}
                    onChange={(e) => { setCustomMinutes(e.target.value); setUseCustom(true) }}
                    onFocus={() => setUseCustom(true)}
                    className={cn(inputClass, useCustom && 'ring-2 ring-indigo-500 border-transparent')}
                  />
                  <span className="text-sm text-slate-500 whitespace-nowrap">min</span>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Confidence */}
              <StarRating
                value={confidence}
                onChange={setConfidence}
                label="Confidence after session"
              />

              {/* Productivity */}
              <StarRating
                value={productivity}
                onChange={setProductivity}
                label="Productivity rating"
              />

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you cover? Any struggles?"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white resize-none"
                />
              </div>

              {/* Milestone celebration */}
              {milestone && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <p className="text-base font-semibold text-slate-900">{milestone}</p>
                  <Button onClick={handleClose} className="w-full">
                    Keep it up! 💪
                  </Button>
                </div>
              )}

              {/* Actions */}
              {!milestone && (
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="submit"
                    disabled={saving || saved || effectiveMinutes < 1}
                    className="flex-1"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saved && <CheckCircle2 className="w-4 h-4" />}
                    {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Session'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
