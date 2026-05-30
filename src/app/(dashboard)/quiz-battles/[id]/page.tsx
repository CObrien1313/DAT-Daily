'use client'

import { useState, useEffect, useCallback, useRef, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, Trophy, RefreshCw } from 'lucide-react'
import { getAvatarColor, getInitials } from '@/lib/avatar'
import { cn } from '@/lib/utils'

interface Props { params: Promise<{ id: string }> }

type Option = 'a' | 'b' | 'c' | 'd'
const OPTIONS: Option[] = ['a', 'b', 'c', 'd']

interface Question {
  subject:  string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

interface Profile { id: string; name: string; username: string; level: number }

interface QuizBattle {
  id: string
  challenger_id: string
  opponent_id:   string
  subject:       string | null
  question_count: number
  status:        'pending' | 'active' | 'completed' | 'declined'
  questions:     Question[]
  answers:       string[] | null  // revealed only after submission
  challenger_answers: Record<string, string> | null
  opponent_answers:   Record<string, string> | null
  challenger_score:   number | null
  opponent_score:     number | null
  challenger_time_ms: number | null
  opponent_time_ms:   number | null
  winner_id:     string | null
  is_tie:        boolean
  accepted_at:   string | null
  expires_at:    string | null
  created_at:    string
  challenger:    Profile | null
  opponent:      Profile | null
}

function optionText(q: Question, opt: Option): string {
  return { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d }[opt]
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function formatTimeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

export default function QuizBattlePage({ params }: Props) {
  const { id } = use(params)

  const [battle, setBattle]     = useState<QuizBattle | null>(null)
  const [viewerId, setViewerId] = useState('')
  const [loading, setLoading]   = useState(true)

  // Quiz state
  type Phase = 'lobby' | 'playing' | 'waiting' | 'results'
  const [phase, setPhase]               = useState<Phase>('lobby')
  const [currentQ, setCurrentQ]         = useState(0)
  const [selected, setSelected]         = useState<Option | null>(null)
  const [confirmed, setConfirmed]       = useState(false)
  const [correctAnswer, setCorrectAnswer]       = useState<string | null>(null)
  const [answerFetchDone, setAnswerFetchDone]   = useState(false)
  const [userAnswers, setUserAnswers]   = useState<Record<number, string>>({})
  const [startedAt, setStartedAt]       = useState<number | null>(null)
  const [elapsed, setElapsed]           = useState(0)
  const timerRef                        = useRef<ReturnType<typeof setInterval> | null>(null)
  const [submitting, setSubmitting]     = useState(false)

  // ── Load battle ────────────────────────────────────────────────────────────
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    const res = await fetch(`/api/quiz-battles/${id}`)
    if (res.ok) {
      const data: QuizBattle = await res.json()
      setBattle(data)
    }
    if (!quiet) setLoading(false)
  }, [id])

  useEffect(() => {
    async function init() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setViewerId(user.id)
      await load()
    }
    init()
  }, [load])

  // Sync phase based on battle state + viewer's submission
  useEffect(() => {
    if (!battle || !viewerId) return
    const viewerAnswers = battle.challenger_id === viewerId
      ? battle.challenger_answers
      : battle.opponent_answers
    const viewerHasSubmitted = viewerAnswers !== null

    if (battle.status === 'completed') {
      setPhase('results')
    } else if (battle.status === 'active' && viewerHasSubmitted) {
      setPhase('waiting')
    } else if (phase !== 'playing') {
      setPhase('lobby')
    }
  }, [battle, viewerId, phase])

  // Poll every 8s while waiting for opponent
  useEffect(() => {
    if (phase !== 'waiting') return
    const t = setInterval(() => load(true), 8_000)
    return () => clearInterval(t)
  }, [phase, load])

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'playing' && startedAt !== null) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startedAt)
      }, 500)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, startedAt])

  // ── Actions ────────────────────────────────────────────────────────────────
  function startBattle() {
    const now = Date.now()
    setStartedAt(now)
    setPhase('playing')
    setCurrentQ(0)
    setUserAnswers({})
    setSelected(null)
    setConfirmed(false)
    setCorrectAnswer(null)
    setAnswerFetchDone(false)
  }

  async function confirmAnswer() {
    if (!selected) return
    setUserAnswers((prev) => ({ ...prev, [currentQ]: selected }))
    setConfirmed(true)
    // Reveal correct answer — always unblock Next even if fetch fails
    try {
      const res = await fetch(`/api/quiz-battles/${id}/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIndex: currentQ }),
      })
      if (res.ok) {
        const data = await res.json()
        setCorrectAnswer(data.correctAnswer)
      }
    } catch { /* ignore */ } finally {
      setAnswerFetchDone(true)
    }
  }

  function nextQuestion() {
    if (!battle) return
    if (currentQ < battle.questions.length - 1) {
      setCurrentQ((q) => q + 1)
      setSelected(null)
      setConfirmed(false)
      setCorrectAnswer(null)
      setAnswerFetchDone(false)
    } else {
      submitAnswers()
    }
  }

  async function submitAnswers() {
    if (!startedAt) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)
    const timeMs = Date.now() - startedAt

    await fetch(`/api/quiz-battles/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: userAnswers, time_ms: timeMs }),
    })

    await load()
    setSubmitting(false)
  }

  // ── Render helpers ─────────────────────────────────────────────────────────
  if (loading || !battle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    )
  }

  const { challenger, opponent, status, questions, answers, is_tie, winner_id, expires_at } = battle
  if (!challenger || !opponent) return <div className="p-8 text-slate-500">Battle not found.</div>

  const isChallenger   = battle.challenger_id === viewerId
  const isViewer       = (p: Profile) => p.id === viewerId
  const viewerWon      = status === 'completed' && winner_id === viewerId
  const viewerAnswers  = isChallenger ? battle.challenger_answers : battle.opponent_answers
  const viewerScore    = isChallenger ? battle.challenger_score   : battle.opponent_score
  const oppScore       = isChallenger ? battle.opponent_score     : battle.challenger_score
  const viewerTime     = isChallenger ? battle.challenger_time_ms : battle.opponent_time_ms
  const oppTime        = isChallenger ? battle.opponent_time_ms   : battle.challenger_time_ms
  const oppSubmitted   = (isChallenger ? battle.opponent_answers : battle.challenger_answers) !== null
  const oppProfile     = isChallenger ? opponent : challenger

  // ── PENDING ────────────────────────────────────────────────────────────────
  if (status === 'pending') {
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto">
        <Link href="/battles" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Battles
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-2xl mb-3">⚔️</p>
          <p className="text-base font-bold text-slate-900 mb-1">Challenge sent!</p>
          <p className="text-sm text-slate-500">
            Waiting for <span className="font-semibold">{oppProfile.name}</span> to accept.
          </p>
        </div>
      </div>
    )
  }

  // ── DECLINED ──────────────────────────────────────────────────────────────
  if (status === 'declined') {
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto">
        <Link href="/battles" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Battles
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-500">This challenge was declined.</p>
          <Link href="/battles" className="mt-4 inline-block text-sm text-indigo-600 font-medium hover:underline">
            Back to Battles
          </Link>
        </div>
      </div>
    )
  }

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto">
        <Link href="/battles" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Battles
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* VS banner */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white text-center">
            <p className="text-sm font-semibold opacity-75 mb-3">Quiz Duel · {questions.length} Questions</p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white', getAvatarColor(challenger.id))}>
                  {getInitials(challenger.name)}
                </div>
                <p className="text-xs font-medium">{challenger.name}{isViewer(challenger) && ' (you)'}</p>
              </div>
              <span className="text-xl font-black text-indigo-300">VS</span>
              <div className="flex flex-col items-center gap-1">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white', getAvatarColor(opponent.id))}>
                  {getInitials(opponent.name)}
                </div>
                <p className="text-xs font-medium">{opponent.name}{isViewer(opponent) && ' (you)'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-xl divide-y divide-slate-100 text-sm">
              {battle.subject && (
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Subject</span>
                  <span className="font-medium">{battle.subject}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-500">Questions</span>
                <span className="font-medium">{questions.length}</span>
              </div>
              {expires_at && (
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Time limit</span>
                  <span className="font-medium text-amber-600">{formatTimeLeft(expires_at)}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-500">Opponent</span>
                <span className="font-medium">
                  {oppSubmitted ? '✅ Finished' : '⏳ Waiting'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Answer all questions in one sitting. Your time starts when you click Start.
            </p>

            <button
              onClick={startBattle}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Start Battle ⚔️
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (phase === 'playing' && questions.length > 0) {
    const q = questions[currentQ]
    const isLast = currentQ === questions.length - 1

    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-slate-500">
            Question <span className="text-slate-900">{currentQ + 1}</span> / {questions.length}
          </p>
          <div className="flex items-center gap-1.5 text-sm text-indigo-600 font-mono font-semibold">
            <Clock className="w-4 h-4" />
            {formatMs(elapsed)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${((currentQ) / questions.length) * 100}%` }}
          />
        </div>

        {/* Subject badge */}
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">{q.subject}</p>

        {/* Question */}
        <p className="text-base font-medium text-slate-900 leading-relaxed mb-5">{q.question}</p>

        {/* Options */}
        <div className="space-y-2.5 mb-4">
          {OPTIONS.map((opt) => {
            let cls = 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-700'
            if (confirmed && correctAnswer) {
              const isCorrect = opt === correctAnswer
              const isSelected = opt === selected
              if (isCorrect) {
                cls = 'border-emerald-400 bg-emerald-50 text-emerald-800 cursor-default'
              } else if (isSelected && !isCorrect) {
                cls = 'border-red-400 bg-red-50 text-red-700 cursor-default'
              } else {
                cls = 'border-slate-100 bg-white text-slate-300 cursor-default'
              }
            } else if (confirmed) {
              cls = opt === selected
                ? 'border-indigo-300 bg-indigo-50 text-indigo-800 cursor-default'
                : 'border-slate-100 bg-white text-slate-400 cursor-default'
            } else if (opt === selected) {
              cls = 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300 text-indigo-900 font-medium'
            }
            return (
              <button
                key={opt}
                disabled={confirmed}
                onClick={() => setSelected(opt)}
                className={cn('w-full flex items-start gap-3 p-3.5 rounded-xl border text-sm text-left transition-all', cls)}
              >
                <span className="font-bold uppercase flex-shrink-0 w-4 mt-0.5">{opt}.</span>
                <span className="flex-1 leading-snug">{optionText(q, opt)}</span>
                {confirmed && correctAnswer && opt === correctAnswer && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                )}
                {confirmed && correctAnswer && opt === selected && opt !== correctAnswer && (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                )}
              </button>
            )
          })}
        </div>

        {/* Feedback chip */}
        {confirmed && correctAnswer && (
          <div className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mb-3',
            selected === correctAnswer
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          )}>
            {selected === correctAnswer
              ? <><CheckCircle2 className="w-4 h-4" /> Correct!</>
              : <><XCircle className="w-4 h-4" /> Incorrect — correct answer: <span className="uppercase">{correctAnswer}</span></>
            }
          </div>
        )}

        {!confirmed ? (
          <button
            onClick={confirmAnswer}
            disabled={!selected}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Confirm Answer
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            disabled={submitting || !answerFetchDone}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {(submitting || !answerFetchDone) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitting ? 'Submitting…' : !answerFetchDone ? 'Loading…' : isLast ? 'Submit Answers' : 'Next Question →'}
          </button>
        )}
      </div>
    )
  }

  // ── WAITING for opponent ───────────────────────────────────────────────────
  if (phase === 'waiting') {
    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto">
        <Link href="/battles" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Battles
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-100 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
          <p className="text-base font-bold text-slate-900">You're done!</p>
          <p className="text-sm text-slate-500">
            Your score: <span className="font-bold text-indigo-600">{viewerScore}/{questions.length}</span>
            {viewerTime !== null && <> · {formatMs(viewerTime)}</>}
          </p>
          <p className="text-sm text-slate-400">
            Waiting for <span className="font-semibold text-slate-600">{oppProfile.name}</span> to finish…
          </p>
          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check now
          </button>
        </div>
      </div>
    )
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (phase === 'results' || status === 'completed') {
    const total    = questions.length
    const myScore  = viewerAnswers !== null ? (viewerScore ?? 0) : null
    const theirScore = oppScore

    return (
      <div className="p-4 md:p-8 max-w-lg mx-auto space-y-5">
        <Link href="/battles" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Battles
        </Link>

        {/* Result banner */}
        <div className={cn(
          'rounded-2xl p-6 text-center',
          is_tie ? 'bg-slate-100' :
          viewerWon ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 'bg-slate-800'
        )}>
          <p className="text-4xl mb-2">{is_tie ? '🤝' : viewerWon ? '🏆' : '💪'}</p>
          <p className={cn('text-xl font-black mb-1', is_tie ? 'text-slate-700' : 'text-white')}>
            {is_tie ? "It's a Tie!" : viewerWon ? 'You Win!' : 'Better luck next time'}
          </p>
          <p className={cn('text-sm', is_tie ? 'text-slate-500' : 'text-white/80')}>
            {is_tie    && `Both earned +25 XP`}
            {viewerWon && `+75 XP earned`}
            {!is_tie && !viewerWon && `+25 XP for the effort`}
          </p>
        </div>

        {/* Score comparison */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-bold text-slate-700 mb-4">Final Scores</p>
          <div className="flex gap-3">
            {[
              { profile: isChallenger ? challenger : opponent, score: myScore, time: viewerTime, isYou: true },
              { profile: isChallenger ? opponent : challenger, score: theirScore, time: oppTime,  isYou: false },
            ].map(({ profile, score, time, isYou }) => (
              <div key={profile.id} className={cn(
                'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2',
                winner_id === profile.id ? 'border-yellow-400 bg-yellow-50' :
                is_tie    ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'
              )}>
                {winner_id === profile.id && <span className="text-lg">🏆</span>}
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white', getAvatarColor(profile.id))}>
                  {getInitials(profile.name)}
                </div>
                <p className="text-xs font-semibold text-slate-700 text-center">
                  {profile.name}{isYou && <span className="text-slate-400 font-normal"> (you)</span>}
                </p>
                <p className={cn('text-3xl font-black tabular-nums',
                  winner_id === profile.id ? 'text-yellow-600' : 'text-slate-700'
                )}>
                  {score !== null ? `${score}/${total}` : '—'}
                </p>
                {time !== null && (
                  <p className="text-xs text-slate-400">{formatMs(time)}</p>
                )}
              </div>
            ))}
          </div>
          {is_tie && oppTime !== null && viewerTime !== null && (
            <p className="text-xs text-slate-400 text-center mt-3">
              Tiebreaker: {viewerTime < oppTime ? 'You were faster! 🎉' : oppTime < viewerTime ? `${oppProfile.name} was faster` : 'Identical time — true tie!'}
            </p>
          )}
        </div>

        {/* Per-question review */}
        {answers && viewerAnswers && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-bold text-slate-700 mb-4">Question Review</p>
            <div className="space-y-4">
              {questions.map((q, i) => {
                const myAns      = (viewerAnswers as Record<string, string>)[String(i)]
                const correctAns = answers[i]
                const isCorrect  = myAns === correctAns
                return (
                  <div key={i} className={cn(
                    'p-3 rounded-xl border text-sm',
                    isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  )}>
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                      <p className="font-medium text-slate-800 leading-snug">{q.question}</p>
                    </div>
                    <p className="text-xs text-slate-500 ml-6">
                      Your answer: <span className={cn('font-semibold uppercase', isCorrect ? 'text-emerald-700' : 'text-red-700')}>{myAns ?? '—'}</span>
                      {!isCorrect && (
                        <> · Correct: <span className="font-semibold uppercase text-emerald-700">{correctAns}</span></>
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <Link
          href="/battles"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-indigo-200 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors"
        >
          <Trophy className="w-4 h-4" />
          Back to Battles
        </Link>
      </div>
    )
  }

  return null
}
