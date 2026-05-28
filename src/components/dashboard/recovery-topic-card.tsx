'use client'

import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Loader2, Sparkles,
  CheckCircle2, XCircle, RotateCcw, Trophy,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { UpgradeModal } from '@/components/ui/upgrade-modal'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { WeakTopic } from '@/lib/types'
import { useXP } from '@/contexts/xp-context'

// ── Types ────────────────────────────────────────────────────────────────────

export interface PracticeQuestion {
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation: string
}

export interface StudySession {
  title: string
  duration_minutes: number
  description: string
}

export interface RecoveryPlan {
  id: string
  topic_id: string
  topic: string
  subject: string
  overview: string
  key_points: string[]
  practice_questions: PracticeQuestion[]
  study_sessions: StudySession[]
  tips: string[]
  created_at: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const OPTIONS = ['a', 'b', 'c', 'd'] as const
type Option = typeof OPTIONS[number]

function optionText(q: PracticeQuestion, opt: Option): string {
  return { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d }[opt]
}

const PRIORITY_STYLE = {
  high: { border: 'border-l-red-400', dot: 'bg-red-400', badge: 'danger' as const },
  medium: { border: 'border-l-amber-400', dot: 'bg-amber-400', badge: 'warning' as const },
  low: { border: 'border-l-emerald-400', dot: 'bg-emerald-400', badge: 'default' as const },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
      {children}
    </h4>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  topic: WeakTopic
  initialPlan: RecoveryPlan | null
}

export function RecoveryTopicCard({ topic, initialPlan }: Props) {
  const { awardXP } = useXP()
  const [plan, setPlan] = useState<RecoveryPlan | null>(initialPlan)
  const [expanded, setExpanded] = useState(!!initialPlan)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null)
  const [resolved, setResolved] = useState(false)

  // Quiz state
  const [quizMode, setQuizMode] = useState<'idle' | 'active' | 'done'>('idle')
  const [currentQIdx, setCurrentQIdx] = useState(0)
  const [selectedForCurrent, setSelectedForCurrent] = useState<Option | null>(null)
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState<Array<{ selected: string; isCorrect: boolean }>>([])

  const ps = PRIORITY_STYLE[topic.priority]

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function generatePlan() {
    setGenerating(true)
    setGenError(null)
    try {
      const res = await fetch('/api/recovery-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id, topic: topic.topic, subject: topic.subject }),
      })
      if (!res.ok) {
        try {
          const body = await res.json()
          if (body?.error === 'limit_reached') {
            setUpgradeMsg(body.message as string)
            setGenerating(false)
            return
          }
          throw new Error(body?.error ?? `Request failed (${res.status})`)
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== `Request failed (${res.status})`) throw parseErr
          throw new Error(`Request failed (${res.status})`)
        }
      }
      const data: RecoveryPlan = await res.json()
      setPlan(data)
      setExpanded(true)
      resetQuiz()
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed — please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function resetQuiz() {
    setQuizMode('idle')
    setCurrentQIdx(0)
    setSelectedForCurrent(null)
    setChecked(false)
    setResults([])
  }

  function checkAnswer() {
    if (!plan || !selectedForCurrent) return
    const q = plan.practice_questions[currentQIdx]
    setResults((prev) => [...prev, { selected: selectedForCurrent, isCorrect: selectedForCurrent === q.correct_option }])
    setChecked(true)
  }

  function nextQuestion() {
    if (!plan) return
    if (currentQIdx < plan.practice_questions.length - 1) {
      setCurrentQIdx((i) => i + 1)
      setSelectedForCurrent(null)
      setChecked(false)
    } else {
      // Quiz finished — award XP based on score so far + the answer we just checked
      const finalScore = results.filter((r) => r.isCorrect).length
      const passed = finalScore >= 2  // 2/3 or 3/3
      awardXP({ type: passed ? 'RECOVERY_QUIZ_PASS' : 'RECOVERY_QUIZ_COMPLETE' })
      setQuizMode('done')
    }
  }

  async function markResolved() {
    setResolved(true)
    const supabase = createClient()
    await supabase.from('weak_topics').update({ resolved: true }).eq('id', topic.id)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (resolved) return null

  if (upgradeMsg) {
    return (
      <>
        <div className={cn('rounded-xl border border-slate-200 bg-white overflow-hidden border-l-4 shadow-sm', ps.border)}>
          <div className="flex items-center gap-3 p-4">
            <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', ps.dot)} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{topic.topic}</p>
              <p className="text-xs text-slate-400">{topic.subject}</p>
            </div>
          </div>
        </div>
        <UpgradeModal message={upgradeMsg} onClose={() => setUpgradeMsg(null)} />
      </>
    )
  }

  const questions = plan?.practice_questions ?? []
  const currentQ = questions[currentQIdx]
  const score = results.filter((r) => r.isCorrect).length
  const lastResult = results[results.length - 1]

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white overflow-hidden border-l-4 shadow-sm', ps.border)}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => plan && setExpanded((e) => !e)}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left',
          plan ? 'hover:bg-slate-50 transition-colors cursor-pointer' : 'cursor-default',
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', ps.dot)} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{topic.topic}</p>
            <p className="text-xs text-slate-400">{topic.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <Badge variant={ps.badge}>{topic.priority}</Badge>
          {plan && (expanded
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* ── No plan yet ───────────────────────────────────────────────────── */}
      {!plan && (
        <div className="px-4 pb-4">
          {genError && <p className="text-xs text-red-500 mb-2">{genError}</p>}
          {generating ? (
            <div className="flex items-center gap-2.5 py-3 text-indigo-600 text-sm">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span>Building your personalized plan… <span className="text-slate-400">(~10 seconds)</span></span>
            </div>
          ) : (
            <button
              type="button"
              onClick={generatePlan}
              className="flex items-center gap-2 w-full justify-center py-3 rounded-lg border-2 border-dashed border-indigo-200 text-indigo-600 text-sm font-medium hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Generate Recovery Plan
            </button>
          )}
        </div>
      )}

      {/* ── Plan content (expanded) ───────────────────────────────────────── */}
      {plan && expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">

          {/* Overview */}
          <div className="px-4 py-4">
            <SectionLabel>Overview</SectionLabel>
            <p className="text-sm text-slate-700 leading-relaxed">{plan.overview}</p>
          </div>

          {/* Key concepts */}
          <div className="px-4 py-4">
            <SectionLabel>Key Concepts to Master</SectionLabel>
            <ul className="space-y-2">
              {plan.key_points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="text-indigo-400 flex-shrink-0 mt-0.5 font-bold">→</span>
                  <span className="leading-snug">{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Practice Quiz ──────────────────────────────────────────────── */}
          <div className="px-4 py-4">
            <SectionLabel>Practice Quiz · {questions.length} Questions</SectionLabel>
            <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-4">

              {/* Idle — start button */}
              {quizMode === 'idle' && (
                <div className="text-center py-1">
                  <p className="text-sm text-indigo-700 font-medium mb-3">
                    Test yourself with 3 targeted practice questions.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuizMode('active')}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Start Practice Quiz
                  </button>
                </div>
              )}

              {/* Active — current question */}
              {quizMode === 'active' && currentQ && (
                <div className="space-y-3">
                  {/* Progress dots */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600">
                      Question {currentQIdx + 1} of {questions.length}
                    </span>
                    <div className="flex gap-1.5">
                      {questions.map((_, i) => (
                        <div
                          key={i}
                          className={cn('w-2 h-2 rounded-full transition-colors',
                            i < results.length
                              ? results[i].isCorrect ? 'bg-emerald-400' : 'bg-red-400'
                              : i === currentQIdx ? 'bg-indigo-600' : 'bg-indigo-200'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Question text */}
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">{currentQ.question}</p>

                  {/* Options */}
                  <div className="space-y-2">
                    {OPTIONS.map((opt) => {
                      const isCorrectOpt = opt === currentQ.correct_option
                      const isUserOpt = opt === selectedForCurrent
                      let cls = 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/30'
                      if (checked) {
                        if (isCorrectOpt) cls = 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        else if (isUserOpt) cls = 'bg-red-50 border-red-200 text-red-700'
                        else cls = 'bg-white border-slate-100 text-slate-400'
                      } else if (isUserOpt) {
                        cls = 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-300 text-indigo-900 font-medium'
                      }
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={checked}
                          onClick={() => setSelectedForCurrent(opt)}
                          className={cn('w-full flex items-start gap-3 p-3 rounded-lg border text-sm text-left transition-all', cls)}
                        >
                          <span className="font-bold uppercase flex-shrink-0 w-4">{opt}.</span>
                          <span className="flex-1">{optionText(currentQ, opt)}</span>
                          {checked && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                          {checked && isUserOpt && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                        </button>
                      )
                    })}
                  </div>

                  {/* Explanation */}
                  {checked && (
                    <div className={cn(
                      'p-3 rounded-lg border text-sm',
                      lastResult?.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                    )}>
                      <p className="font-semibold text-slate-900 mb-1">
                        {lastResult?.isCorrect ? '✓ Correct!' : `✗ Correct answer: ${currentQ.correct_option.toUpperCase()}`}
                      </p>
                      <p className="text-slate-600 leading-relaxed">{currentQ.explanation}</p>
                    </div>
                  )}

                  {/* Action button */}
                  {!checked ? (
                    <button
                      type="button"
                      onClick={checkAnswer}
                      disabled={!selectedForCurrent}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={nextQuestion}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      {currentQIdx < questions.length - 1 ? 'Next Question →' : 'See Results'}
                    </button>
                  )}
                </div>
              )}

              {/* Done — results */}
              {quizMode === 'done' && (
                <div className="text-center space-y-3 py-1">
                  <Trophy className={cn('w-9 h-9 mx-auto',
                    score === questions.length ? 'text-amber-400'
                    : score >= 2 ? 'text-emerald-500'
                    : 'text-slate-400'
                  )} />
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{score}/{questions.length}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {score === questions.length
                        ? 'Perfect! You\'ve mastered this topic. 🎉'
                        : score >= 2
                        ? 'Good work — review the explanations above and you\'ll have it.'
                        : 'Keep reviewing the key concepts and try again.'}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={resetQuiz}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retake
                    </button>
                    {score >= 2 && (
                      <button
                        type="button"
                        onClick={markResolved}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark as Mastered
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Study sessions */}
          <div className="px-4 py-4">
            <SectionLabel>Suggested Study Sessions</SectionLabel>
            <div className="space-y-2.5">
              {plan.study_sessions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded mt-0.5 flex-shrink-0 whitespace-nowrap">
                    {s.duration_minutes} min
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="px-4 py-4">
            <SectionLabel>Quick Tips</SectionLabel>
            <ul className="space-y-2">
              {plan.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="flex-shrink-0">💡</span>
                  <span className="leading-snug">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer actions */}
          <div className="px-4 py-3 bg-slate-50 flex items-center gap-2">
            <button
              type="button"
              onClick={markResolved}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark as Mastered
            </button>
            <button
              type="button"
              onClick={generatePlan}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Regenerate Plan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
