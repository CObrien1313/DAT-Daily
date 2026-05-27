'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useXP } from '@/contexts/xp-context'

const SUBJECT_BADGE_VARIANT: Record<string, 'default' | 'success' | 'info' | 'warning'> = {
  Biology: 'success',
  'General Chemistry': 'info',
  'Organic Chemistry': 'default',
  'Quantitative Reasoning': 'default',
  'Perceptual Ability': 'warning',
  'Reading Comprehension': 'info',
}

interface DailyQuestion {
  id: string
  question_date: string
  subject: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation: string
}

interface UserAnswer {
  selected_option: string
  is_correct: boolean
}

interface DailyQuestionCardProps {
  questionDate: string
  userId: string
  initialQuestion: DailyQuestion | null
  initialAnswer: UserAnswer | null
}

const OPTIONS = ['a', 'b', 'c', 'd'] as const
type Option = typeof OPTIONS[number]

function optionText(q: DailyQuestion, opt: Option): string {
  return { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d }[opt]
}

export function DailyQuestionCard({
  questionDate,
  userId,
  initialQuestion,
  initialAnswer,
}: DailyQuestionCardProps) {
  const { awardXP } = useXP()
  const [question, setQuestion] = useState<DailyQuestion | null>(initialQuestion)
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'error'>(
    initialQuestion ? 'idle' : 'loading'
  )
  const [selected, setSelected] = useState<Option | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [saving, setSaving] = useState(false)

  const alreadyAnswered = initialAnswer !== null

  // Fetch question from API if not pre-loaded
  useEffect(() => {
    if (initialQuestion) return
    fetch('/api/daily-question')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((q: DailyQuestion) => {
        setQuestion(q)
        setFetchState('idle')
      })
      .catch(() => setFetchState('error'))
  }, [initialQuestion])

  async function handleSubmit() {
    if (!selected || !question || saving) return
    setSaving(true)

    const correct = selected === question.correct_option
    setIsCorrect(correct)

    const supabase = createClient()
    await supabase.from('daily_question_answers').insert({
      user_id: userId,
      question_date: questionDate,
      selected_option: selected,
      is_correct: correct,
    })

    // Award XP after answer is saved
    awardXP({ type: correct ? 'DAILY_QUESTION_CORRECT' : 'DAILY_QUESTION_ANY' })

    setSaving(false)
    setSubmitted(true)
  }

  // ── Option row renderer ────────────────────────────────────────────────────
  function ResultOption({ opt, userOpt }: { opt: Option; userOpt: Option | null }) {
    if (!question) return null
    const isCorrectOpt = opt === question.correct_option
    const isUserOpt = opt === userOpt
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border text-sm',
          isCorrectOpt
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : isUserOpt
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        )}
      >
        <span className="font-bold uppercase flex-shrink-0 w-4">{opt}.</span>
        <span className="flex-1">{optionText(question, opt)}</span>
        {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
        {isUserOpt && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle>Today&apos;s Question</CardTitle>
          {question && (
            <Badge variant={SUBJECT_BADGE_VARIANT[question.subject] ?? 'default'}>
              {question.subject}
            </Badge>
          )}
        </div>
        {question && (
          <p className="text-xs text-slate-400 mt-0.5">Resets 8 AM ET daily</p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Loading */}
        {fetchState === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Generating today&apos;s question…</span>
          </div>
        )}

        {/* Error */}
        {fetchState === 'error' && (
          <p className="text-sm text-red-500 py-6 text-center">
            Couldn&apos;t load today&apos;s question. Try refreshing the page.
          </p>
        )}

        {/* Already answered — show result */}
        {question && alreadyAnswered && !submitted && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Testing: {question.subject}</p>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">{question.question}</p>
            <div className="space-y-2">
              {OPTIONS.map((opt) => (
                <ResultOption key={opt} opt={opt} userOpt={initialAnswer.selected_option as Option} />
              ))}
            </div>
            <div className={cn(
              'p-3 rounded-lg border text-sm',
              initialAnswer.is_correct ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            )}>
              <p className="font-semibold text-slate-900 mb-1">
                {initialAnswer.is_correct ? '✓ You got it right!' : `✗ Correct answer: ${initialAnswer.selected_option === question.correct_option ? '' : question.correct_option.toUpperCase()}`}
              </p>
              <p className="text-slate-600 leading-relaxed">{question.explanation}</p>
            </div>
            <p className="text-xs text-slate-400 text-center">New question tomorrow at 8 AM ET 🎯</p>
          </div>
        )}

        {/* Unanswered — interactive */}
        {question && !alreadyAnswered && !submitted && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Testing: {question.subject}</p>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">{question.question}</p>
            <div className="space-y-2">
              {OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelected(opt)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg border text-sm text-left transition-all',
                    selected === opt
                      ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-300 text-indigo-900 font-medium'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40 text-slate-700'
                  )}
                >
                  <span className="font-bold uppercase flex-shrink-0 w-4">{opt}.</span>
                  <span>{optionText(question, opt)}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selected || saving}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Submitting…' : 'Check Answer'}
            </button>
          </div>
        )}

        {/* Just submitted — show result */}
        {question && submitted && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Testing: {question.subject}</p>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">{question.question}</p>
            <div className="space-y-2">
              {OPTIONS.map((opt) => (
                <ResultOption key={opt} opt={opt} userOpt={selected} />
              ))}
            </div>
            <div className={cn(
              'p-3 rounded-lg border text-sm',
              isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            )}>
              <p className="font-semibold text-slate-900 mb-1">
                {isCorrect
                  ? '🎉 Correct! Great work.'
                  : `✗ The correct answer was ${question.correct_option.toUpperCase()}.`}
              </p>
              <p className="text-slate-600 leading-relaxed">{question.explanation}</p>
            </div>
            <p className="text-xs text-slate-400 text-center">New question tomorrow at 8 AM ET 🎯</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
