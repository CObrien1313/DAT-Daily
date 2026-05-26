'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { DAT_SUBJECTS } from '@/lib/types'
import type { DATSubject } from '@/lib/types'

const TOTAL_STEPS = 5

interface WizardData {
  name: string
  examDate: string
  weeklyHours: number
  intensity: 'light' | 'moderate' | 'intense'
  weakSubjects: DATSubject[]
  targetScore: number
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white'

// ── Step components ──────────────────────────────────────────────────────────

function StepName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-4xl mb-4">👋</div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to DAT Daily!</h2>
      <p className="text-slate-500 mb-6">Let's build your personalized prep plan. First — what should we call you?</p>
      <label className="block text-sm font-medium text-slate-700 mb-2">Your name</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Conor"
        autoFocus
        className={inputClass}
      />
    </div>
  )
}

function StepExamDate({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-4xl mb-4">📅</div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">When's the big day?</h2>
      <p className="text-slate-500 mb-6">Your exam date sets the urgency of your schedule. Don't have one yet? Skip it — you can add it in Settings.</p>
      <label className="block text-sm font-medium text-slate-700 mb-2">DAT exam date</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  )
}

function StepSchedule({
  hours, intensity, onHours, onIntensity,
}: {
  hours: number
  intensity: 'light' | 'moderate' | 'intense'
  onHours: (v: number) => void
  onIntensity: (v: 'light' | 'moderate' | 'intense') => void
}) {
  const options = [
    { value: 'light' as const, emoji: '☀️', label: 'Light', desc: 'Steady pace, low pressure' },
    { value: 'moderate' as const, emoji: '⚡', label: 'Moderate', desc: 'Balanced — most students' },
    { value: 'intense' as const, emoji: '🔥', label: 'Intense', desc: 'Max focus, max results' },
  ]
  return (
    <div>
      <div className="text-4xl mb-4">💪</div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">How hard do you want to push?</h2>
      <p className="text-slate-500 mb-6">This shapes how your AI schedule is built each week.</p>

      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-2">Weekly study hours</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={hours}
            min={1}
            max={80}
            onChange={(e) => onHours(Number(e.target.value))}
            className="w-24 px-4 py-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold text-center bg-white"
          />
          <span className="text-sm text-slate-500">hours / week</span>
        </div>
      </div>

      <label className="block text-sm font-medium text-slate-700 mb-2">Study intensity</label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onIntensity(opt.value)}
            className={cn(
              'p-3 rounded-xl border text-left transition-all',
              intensity === opt.value
                ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
                : 'bg-white border-slate-200 hover:border-indigo-200'
            )}
          >
            <span className="text-lg">{opt.emoji}</span>
            <p className="text-sm font-semibold text-slate-800 mt-1">{opt.label}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepWeakSubjects({
  selected, onChange,
}: {
  selected: DATSubject[]
  onChange: (v: DATSubject[]) => void
}) {
  function toggle(s: DATSubject) {
    onChange(selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s])
  }
  return (
    <div>
      <div className="text-4xl mb-4">📚</div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Where do you struggle most?</h2>
      <p className="text-slate-500 mb-6">We'll give these subjects extra weight in your schedule. Select all that apply.</p>
      <div className="flex flex-wrap gap-2">
        {DAT_SUBJECTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium border transition-all',
              selected.includes(s)
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4">Not sure yet? You can skip this — your schedule adapts as you log sessions.</p>
    </div>
  )
}

function StepTargetScore({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const presets = [19, 20, 21, 22, 23, 25]
  return (
    <div>
      <div className="text-4xl mb-4">🎯</div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">What's your target score?</h2>
      <p className="text-slate-500 mb-6">
        DAT Academic Average (AA) ranges from 1–30. Most dental schools want 19–22. Top 10th percentile is ~23.
      </p>

      <label className="block text-sm font-medium text-slate-700 mb-2">Target AA score</label>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="number"
          value={value}
          min={1}
          max={30}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 px-4 py-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-2xl font-bold text-center bg-white"
        />
        <span className="text-slate-500 text-sm">out of 30</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {presets.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={cn(
              'py-2.5 rounded-xl text-sm font-semibold border transition-all',
              value === score
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
            )}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main wizard ──────────────────────────────────────────────────────────────

export function OnboardingWizard({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<WizardData>({
    name: initialName,
    examDate: '',
    weeklyHours: 25,
    intensity: 'moderate',
    weakSubjects: [],
    targetScore: 20,
  })

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function next() { setStep((s) => Math.min(s + 1, TOTAL_STEPS)) }
  function back() { setStep((s) => Math.max(s - 1, 1)) }

  async function finish() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // Save profile
    await supabase.from('profiles').update({
      name: data.name.trim() || initialName,
      exam_date: data.examDate || null,
      weekly_hours_goal: data.weeklyHours,
      schedule_intensity: data.intensity,
      target_score: data.targetScore,
      onboarded: true,
    }).eq('id', user.id)

    // Pre-populate subject_progress: weak subjects start at 15%, others at 40%
    const allSubjects = DAT_SUBJECTS
    const upserts = allSubjects.map((subject) => ({
      user_id: user.id,
      subject,
      progress: data.weakSubjects.includes(subject) ? 15 : 40,
    }))
    // Only insert rows that don't already exist
    await supabase.from('subject_progress').upsert(upserts, { onConflict: 'user_id,subject', ignoreDuplicates: true })

    router.replace('/dashboard')
  }

  const progress = (step / TOTAL_STEPS) * 100
  const canSkipExam = step === 2 // exam date is optional

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">DAT Daily</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-8">
            {/* Step indicator */}
            <div className="flex items-center gap-1.5 mb-6">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i + 1 === step ? 'w-6 h-2 bg-indigo-600' : i + 1 < step ? 'w-2 h-2 bg-indigo-300' : 'w-2 h-2 bg-slate-200'
                  )}
                />
              ))}
              <span className="ml-2 text-xs text-slate-400">{step} of {TOTAL_STEPS}</span>
            </div>

            {/* Step content */}
            {step === 1 && <StepName value={data.name} onChange={(v) => update('name', v)} />}
            {step === 2 && <StepExamDate value={data.examDate} onChange={(v) => update('examDate', v)} />}
            {step === 3 && (
              <StepSchedule
                hours={data.weeklyHours}
                intensity={data.intensity}
                onHours={(v) => update('weeklyHours', v)}
                onIntensity={(v) => update('intensity', v)}
              />
            )}
            {step === 4 && (
              <StepWeakSubjects
                selected={data.weakSubjects}
                onChange={(v) => update('weakSubjects', v)}
              />
            )}
            {step === 5 && (
              <StepTargetScore value={data.targetScore} onChange={(v) => update('targetScore', v)} />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={back}
                className={cn(
                  'flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors',
                  step === 1 && 'invisible'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-3">
                {canSkipExam && !data.examDate && (
                  <button
                    onClick={next}
                    className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Skip for now
                  </button>
                )}
                {step < TOTAL_STEPS ? (
                  <button
                    onClick={next}
                    disabled={step === 1 && !data.name.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={finish}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Setting up…</>
                    ) : (
                      <>Let&apos;s go! 🎯</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Everything here can be changed later in Settings.
        </p>
      </div>
    </div>
  )
}
