'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Sword, Loader2, Plus, CheckCircle, XCircle, Clock, Trophy, Zap } from 'lucide-react'
import { getAvatarColor, getInitials } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import { CreateBattleModal } from '@/components/battles/create-battle-modal'
import { formatTimeRemaining, getBattleTypeInfo, type BattleWithProfiles } from '@/lib/battles'

type Tab = 'active' | 'challenges' | 'history' | 'quiz'

// ── Study battle types ────────────────────────────────────────────────────────

function Avatar({ id, name, size = 'md' }: { id: string; name: string; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold text-white flex-shrink-0', sz, getAvatarColor(id))}>
      {getInitials(name)}
    </div>
  )
}

function StatusBadge({ battle, viewerId }: { battle: BattleWithProfiles; viewerId: string }) {
  if (battle.status === 'pending') {
    const isChallenger = battle.challenger_id === viewerId
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
        isChallenger ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700')}>
        {isChallenger ? 'Awaiting response' : 'You were challenged!'}
      </span>
    )
  }
  if (battle.status === 'active' && battle.ends_at) {
    return <span className="text-xs text-emerald-600 font-medium">{formatTimeRemaining(battle.ends_at)}</span>
  }
  if (battle.status === 'completed') {
    const won = battle.winner_id === viewerId
    const tie = battle.winner_id === null
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
        tie ? 'bg-slate-100 text-slate-600' :
        won ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')}>
        {tie ? '🤝 Tie' : won ? '🏆 Won' : 'Lost'}
      </span>
    )
  }
  if (battle.status === 'declined') return <span className="text-xs text-slate-400">Declined</span>
  return null
}

// ── Quiz battle types ─────────────────────────────────────────────────────────

interface QuizBattleProfile { id: string; name: string; username: string; level: number }
interface QuizBattle {
  id: string
  challenger_id: string
  opponent_id:   string
  subject:       string | null
  question_count: number
  status:        string
  challenger_score: number | null
  opponent_score:   number | null
  winner_id:     string | null
  is_tie:        boolean
  challenger_answers: Record<string, string> | null
  opponent_answers:   Record<string, string> | null
  expires_at:    string | null
  created_at:    string
  challenger:    QuizBattleProfile | null
  opponent:      QuizBattleProfile | null
}

function QuizStatusBadge({ battle, viewerId }: { battle: QuizBattle; viewerId: string }) {
  if (battle.status === 'pending') {
    const isChallenger = battle.challenger_id === viewerId
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
        isChallenger ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700')}>
        {isChallenger ? 'Awaiting response' : 'You were challenged!'}
      </span>
    )
  }
  if (battle.status === 'active') {
    const viewerAnswers = battle.challenger_id === viewerId ? battle.challenger_answers : battle.opponent_answers
    const done = viewerAnswers !== null
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
        done ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700')}>
        {done ? '⏳ Waiting for opponent' : '▶ Your turn!'}
      </span>
    )
  }
  if (battle.status === 'completed') {
    const won = battle.winner_id === viewerId
    const tie = battle.is_tie
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
        tie ? 'bg-slate-100 text-slate-600' :
        won ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')}>
        {tie ? '🤝 Tie' : won ? '🏆 Won' : 'Lost'}
      </span>
    )
  }
  if (battle.status === 'declined') return <span className="text-xs text-slate-400">Declined</span>
  return null
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BattlesPage() {
  const [tab, setTab]             = useState<Tab>('active')
  const [battles, setBattles]     = useState<BattleWithProfiles[]>([])
  const [quizBattles, setQuizBattles] = useState<QuizBattle[]>([])
  const [viewerId, setViewerId]   = useState('')
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [responding, setResponding] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setViewerId(user.id)

      const [r1, r2] = await Promise.all([
        fetch('/api/battles'),
        fetch('/api/quiz-battles'),
      ])
      if (r1.ok) setBattles(await r1.json())
      if (r2.ok) setQuizBattles(await r2.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function respond(battleId: string, action: 'accept' | 'decline') {
    setResponding(battleId)
    await fetch(`/api/battles/${battleId}/respond`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await load()
    setResponding(null)
  }

  async function respondQuiz(battleId: string, action: 'accept' | 'decline') {
    setResponding(battleId)
    await fetch(`/api/quiz-battles/${battleId}/respond`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await load()
    setResponding(null)
  }

  const active     = battles.filter((b) => b.status === 'active')
  const challenges = battles.filter((b) => b.status === 'pending' && b.opponent_id === viewerId)
  const sent       = battles.filter((b) => b.status === 'pending' && b.challenger_id === viewerId)
  const history    = battles.filter((b) => b.status === 'completed' || b.status === 'declined')

  // Quiz challenges (incoming pending)
  const quizChallenges = quizBattles.filter((b) => b.status === 'pending' && b.opponent_id === viewerId)
  const totalChallenges = challenges.length + quizChallenges.length

  // Pending quiz duels that are your turn to answer
  const quizYourTurn = quizBattles.filter((b) => {
    if (b.status !== 'active') return false
    const myAnswers = b.challenger_id === viewerId ? b.challenger_answers : b.opponent_answers
    return myAnswers === null
  })

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sword className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Battles</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Battle
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5 overflow-x-auto">
        {([
          { id: 'active'     as Tab, label: `Active${active.length + sent.length > 0 ? ` (${active.length + sent.length})` : ''}` },
          { id: 'challenges' as Tab, label: `Challenges${totalChallenges > 0 ? ` (${totalChallenges})` : ''}` },
          { id: 'history'    as Tab, label: 'History' },
          { id: 'quiz'       as Tab, label: `Quiz Duels${quizYourTurn.length > 0 ? ` 🔥` : ''}` },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn('flex-shrink-0 py-2 px-2.5 rounded-lg text-sm font-medium transition-colors',
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      )}

      {/* ── Study battles (Active / Challenges / History) ─────────────────── */}
      {!loading && tab !== 'quiz' && (() => {
        const studyList = tab === 'active' ? [...active, ...sent] : tab === 'challenges' ? challenges : history
        const quizList  = tab === 'challenges' ? quizChallenges : []

        const isEmpty = studyList.length === 0 && quizList.length === 0
        if (isEmpty) {
          return (
            <div className="text-center py-20 text-slate-400">
              <Sword className="w-8 h-8 mx-auto mb-3 text-slate-200" />
              <p className="text-sm">
                {tab === 'active'     && 'No active battles. Challenge a friend!'}
                {tab === 'challenges' && 'No pending challenges.'}
                {tab === 'history'    && 'No completed battles yet.'}
              </p>
            </div>
          )
        }

        return (
          <div className="space-y-3">
            {/* Study battles */}
            {studyList.map((b) => {
              if (!b.challenger || !b.opponent) return null
              const opponentProfile = b.challenger_id === viewerId ? b.opponent : b.challenger
              const typeInfo = getBattleTypeInfo(b.battle_type)
              const isPending = b.status === 'pending'
              const isChallenge = isPending && b.opponent_id === viewerId
              const isSent = isPending && b.challenger_id === viewerId
              return (
                <div key={b.id} className={cn('p-4 rounded-xl border transition-colors',
                  isChallenge ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200')}>
                  <div className="flex items-center gap-3">
                    {b.status === 'active'
                      ? <Link href={`/battles/${b.id}`}><Avatar id={opponentProfile.id} name={opponentProfile.name} /></Link>
                      : <Avatar id={opponentProfile.id} name={opponentProfile.name} />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">
                          {isChallenge ? `${b.challenger.name} challenged you` : opponentProfile.name}
                        </p>
                        <StatusBadge battle={b} viewerId={viewerId} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {typeInfo.emoji} {typeInfo.label}{b.subject ? ` · ${b.subject}` : ''}
                      </p>
                    </div>
                    {b.status === 'active' && (
                      <Link href={`/battles/${b.id}`} className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
                        View →
                      </Link>
                    )}
                    {isSent && <span className="flex items-center gap-1 text-xs text-amber-600 flex-shrink-0"><Clock className="w-3.5 h-3.5" />Pending</span>}
                    {isChallenge && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => respond(b.id, 'accept')} disabled={responding === b.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                          {responding === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}Accept
                        </button>
                        <button onClick={() => respond(b.id, 'decline')} disabled={responding === b.id}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {b.status === 'completed' && (
                      <Link href={`/battles/${b.id}`} className="flex-shrink-0 text-xs text-slate-400 hover:text-indigo-600 transition-colors">Details →</Link>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Quiz challenges mixed in on Challenges tab */}
            {quizList.map((b) => {
              if (!b.challenger || !b.opponent) return null
              return (
                <div key={b.id} className="p-4 rounded-xl border bg-indigo-50 border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0', getAvatarColor(b.challenger.id))}>
                      {getInitials(b.challenger.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{b.challenger.name} challenged you</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">You were challenged!</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">🧠 Quiz Duel · {b.question_count} questions{b.subject ? ` · ${b.subject}` : ''}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => respondQuiz(b.id, 'accept')} disabled={responding === b.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                        {responding === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}Accept
                      </button>
                      <button onClick={() => respondQuiz(b.id, 'decline')} disabled={responding === b.id}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ── Quiz Duels tab ────────────────────────────────────────────────── */}
      {!loading && tab === 'quiz' && (
        <>
          {quizBattles.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Zap className="w-8 h-8 mx-auto mb-3 text-slate-200" />
              <p className="text-sm">No Quiz Duels yet. Challenge a friend!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizBattles.map((b) => {
                if (!b.challenger || !b.opponent) return null
                const oppProfile  = b.challenger_id === viewerId ? b.opponent : b.challenger
                const isChallenge = b.status === 'pending' && b.opponent_id === viewerId
                const isSent      = b.status === 'pending' && b.challenger_id === viewerId
                const myAnswers   = b.challenger_id === viewerId ? b.challenger_answers : b.opponent_answers
                const yourTurn    = b.status === 'active' && myAnswers === null

                return (
                  <div key={b.id} className={cn('p-4 rounded-xl border',
                    isChallenge ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200')}>
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0', getAvatarColor(oppProfile.id))}>
                        {getInitials(oppProfile.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900">
                            {isChallenge ? `${b.challenger.name} challenged you` : oppProfile.name}
                          </p>
                          <QuizStatusBadge battle={b} viewerId={viewerId} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          🧠 Quiz Duel · {b.question_count} questions{b.subject ? ` · ${b.subject}` : ''}
                        </p>
                      </div>

                      {(yourTurn || b.status === 'active') && (
                        <Link href={`/quiz-battles/${b.id}`}
                          className={cn('flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                            yourTurn ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                          {yourTurn ? 'Play ▶' : 'View →'}
                        </Link>
                      )}
                      {isSent && <span className="flex items-center gap-1 text-xs text-amber-600 flex-shrink-0"><Clock className="w-3.5 h-3.5" />Pending</span>}
                      {isChallenge && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => respondQuiz(b.id, 'accept')} disabled={responding === b.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                            {responding === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}Accept
                          </button>
                          <button onClick={() => respondQuiz(b.id, 'decline')} disabled={responding === b.id}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {b.status === 'completed' && (
                        <Link href={`/quiz-battles/${b.id}`} className="flex-shrink-0 flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors">
                          <Trophy className="w-3.5 h-3.5" />Results
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateBattleModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />
      )}
    </div>
  )
}
