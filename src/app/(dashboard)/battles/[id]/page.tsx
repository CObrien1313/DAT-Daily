'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, RotateCcw } from 'lucide-react'
import { getAvatarColor, getInitials } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import {
  formatTimeRemaining,
  formatScore,
  getBattleTypeInfo,
  type BattleWithProfiles,
  type BattleScore,
  type BattleType,
} from '@/lib/battles'

interface Props {
  params: Promise<{ id: string }>
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlayerCard({
  profile,
  score,
  type,
  isLeading,
  isWinner,
  isViewer,
}: {
  profile: { id: string; name: string; username: string; level: number }
  score: BattleScore | null
  type: BattleType
  isLeading: boolean
  isWinner: boolean | null
  isViewer: boolean
}) {
  const val = score?.score ?? 0
  return (
    <div className={cn(
      'flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors',
      isWinner === true  ? 'border-yellow-400 bg-yellow-50'  :
      isWinner === false ? 'border-slate-200 bg-slate-50'    :
      isLeading          ? 'border-indigo-300 bg-indigo-50'  :
      'border-slate-200 bg-white'
    )}>
      {isWinner === true && <span className="text-lg">🏆</span>}
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white', getAvatarColor(profile.id))}>
        {getInitials(profile.name)}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-900 leading-tight">
          {profile.name}
          {isViewer && <span className="ml-1 text-xs font-normal text-slate-400">(you)</span>}
        </p>
        <p className="text-xs text-slate-400">@{profile.username} · Lv.{profile.level}</p>
      </div>
      <p className={cn(
        'text-3xl font-black tabular-nums',
        isWinner === true  ? 'text-yellow-600' :
        isLeading          ? 'text-indigo-700'  :
        'text-slate-700'
      )}>
        {formatScore(val, type)}
      </p>
    </div>
  )
}

function ScoreBar({ label, a, b, maxVal }: { label: string; a: number; b: number; maxVal: number }) {
  const max = Math.max(maxVal, 1)
  const pctA = Math.round((a / max) * 100)
  const pctB = Math.round((b / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500 font-medium">
        <span>{a}</span>
        <span className="text-slate-400">{label}</span>
        <span>{b}</span>
      </div>
      <div className="flex gap-1 items-center">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex justify-end">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pctA}%` }} />
        </div>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-rose-400 rounded-full transition-all" style={{ width: `${pctB}%` }} />
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BattlePage({ params }: Props) {
  const { id } = use(params)

  const [battle, setBattle]   = useState<BattleWithProfiles | null>(null)
  const [viewerId, setViewerId] = useState<string>('')
  const [loading, setLoading]  = useState(true)
  const [completing, setCompleting] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const load = useCallback(async () => {
    const res = await fetch(`/api/battles/${id}`)
    if (res.ok) setBattle(await res.json())
    setLastRefresh(Date.now())
  }, [id])

  useEffect(() => {
    async function init() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setViewerId(user.id)
      await load()
      setLoading(false)
    }
    init()
  }, [load])

  // Poll every 30s while active
  useEffect(() => {
    if (!battle || battle.status !== 'active') return
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [battle, load])

  // Auto-complete when battle has ended
  useEffect(() => {
    if (!battle || battle.status !== 'active' || !battle.ends_at) return
    if (new Date(battle.ends_at) > new Date()) return

    async function complete() {
      setCompleting(true)
      const res = await fetch(`/api/battles/${id}/complete`, { method: 'POST' })
      if (res.ok) await load()
      setCompleting(false)
    }
    complete()
  }, [battle, id, load])

  if (loading || !battle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    )
  }

  if (!battle.challenger || !battle.opponent) {
    return <div className="p-8 text-slate-500">Battle not found.</div>
  }

  const { challenger, opponent, status, battle_type, subject, ends_at, winner_id } = battle
  const typeInfo = getBattleTypeInfo(battle_type)

  const challengerScore = battle.scores?.find((s) => s.user_id === challenger.id) ?? null
  const opponentScore   = battle.scores?.find((s) => s.user_id === opponent.id)   ?? null

  const cVal = challengerScore?.score ?? 0
  const oVal = opponentScore?.score   ?? 0

  const cLeading = cVal > oVal
  const oLeading = oVal > cVal

  const challengerWon = status === 'completed' ? (winner_id === challenger.id ? true : winner_id === null ? null : false) : null
  const opponentWon   = status === 'completed' ? (winner_id === opponent.id   ? true : winner_id === null ? null : false) : null

  const viewerWon  = status === 'completed' ? winner_id === viewerId : null
  const isTie      = status === 'completed' && winner_id === null

  // Breakdown bars — use the higher score as 100%
  const maxQ = Math.max(challengerScore?.questions ?? 0, opponentScore?.questions ?? 0)
  const maxM = Math.max(challengerScore?.minutes   ?? 0, opponentScore?.minutes   ?? 0)
  const maxS = Math.max(cVal, oVal)

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/battles" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Battles
      </Link>

      {/* Battle title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {typeInfo.emoji} {typeInfo.label} Battle
          </h1>
          {subject && <p className="text-sm text-slate-400">{subject}</p>}
        </div>
        {status === 'active' && (
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        )}
      </div>

      {/* ── COMPLETED END SCREEN ──────────────────────────────────── */}
      {status === 'completed' && (
        <div className={cn(
          'rounded-2xl p-6 mb-5 text-center',
          isTie ? 'bg-slate-100' :
          viewerWon ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 'bg-slate-800'
        )}>
          <p className="text-4xl mb-2">
            {isTie ? '🤝' : viewerWon ? '🏆' : '💪'}
          </p>
          <p className={cn('text-xl font-black mb-1',
            isTie ? 'text-slate-700' : viewerWon ? 'text-white' : 'text-white'
          )}>
            {isTie ? "It's a Tie!" : viewerWon ? 'You Win!' : 'Better luck next time'}
          </p>
          <p className={cn('text-sm',
            isTie ? 'text-slate-500' : viewerWon ? 'text-yellow-100' : 'text-slate-400'
          )}>
            {isTie    && `Both players earned +25 XP`}
            {viewerWon && `+75 XP earned`}
            {!isTie && !viewerWon && `+${oVal > 0 && cVal > 0 && Math.abs(cVal - oVal) / Math.max(cVal, oVal) < 0.1 ? 40 : 25} XP for the effort`}
          </p>
        </div>
      )}

      {/* ── TIMER (active only) ───────────────────────────────────── */}
      {status === 'active' && ends_at && (
        <div className="text-center mb-5">
          <p className="text-2xl font-black text-indigo-600">{formatTimeRemaining(ends_at)}</p>
          {completing && <p className="text-xs text-slate-400 mt-1">Calculating results…</p>}
        </div>
      )}

      {/* ── PLAYER CARDS ─────────────────────────────────────────── */}
      <div className="flex gap-3 mb-5">
        <PlayerCard
          profile={challenger}
          score={challengerScore}
          type={battle_type}
          isLeading={cLeading}
          isWinner={challengerWon}
          isViewer={challenger.id === viewerId}
        />
        <div className="flex items-center justify-center flex-shrink-0 text-slate-300 font-black text-xl">
          VS
        </div>
        <PlayerCard
          profile={opponent}
          score={opponentScore}
          type={battle_type}
          isLeading={oLeading}
          isWinner={opponentWon}
          isViewer={opponent.id === viewerId}
        />
      </div>

      {/* ── SCORE BREAKDOWN ──────────────────────────────────────── */}
      {(challengerScore || opponentScore) && battle_type !== 'streak' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 mb-5">
          <p className="text-sm font-bold text-slate-700">Score Breakdown</p>
          <p className="text-xs text-slate-400 -mt-2">
            <span className="inline-block w-2.5 h-2.5 bg-indigo-500 rounded-full mr-1" />
            {challenger.name}
            <span className="mx-2 text-slate-300">·</span>
            <span className="inline-block w-2.5 h-2.5 bg-rose-400 rounded-full mr-1" />
            {opponent.name}
          </p>

          {(battle_type === 'combined' || battle_type === 'questions' || battle_type === 'accuracy') && (
            <ScoreBar
              label="Questions"
              a={challengerScore?.questions ?? 0}
              b={opponentScore?.questions ?? 0}
              maxVal={maxQ}
            />
          )}
          {(battle_type === 'combined' || battle_type === 'accuracy') && (
            <ScoreBar
              label="Accuracy %"
              a={challengerScore ? (challengerScore.questions > 0 ? Math.round(100 * challengerScore.correct / challengerScore.questions) : 0) : 0}
              b={opponentScore   ? (opponentScore.questions   > 0 ? Math.round(100 * opponentScore.correct   / opponentScore.questions)   : 0) : 0}
              maxVal={100}
            />
          )}
          {(battle_type === 'combined' || battle_type === 'study_time') && (
            <ScoreBar
              label="Minutes"
              a={challengerScore?.minutes ?? 0}
              b={opponentScore?.minutes   ?? 0}
              maxVal={maxM}
            />
          )}
          {battle_type === 'combined' && (
            <ScoreBar
              label="Total Score"
              a={cVal}
              b={oVal}
              maxVal={maxS}
            />
          )}
        </div>
      )}

      {/* ── PENDING state ─────────────────────────────────────────── */}
      {status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-amber-800 mb-1">Waiting for acceptance</p>
          <p className="text-xs text-amber-600">
            {battle.opponent_id === viewerId
              ? 'You were challenged — go to Battles to accept.'
              : `${opponent.name} hasn't accepted yet.`}
          </p>
        </div>
      )}

      {/* ── REMATCH button (completed) ────────────────────────────── */}
      {status === 'completed' && (
        <Link
          href="/battles"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-indigo-200 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Start a Rematch
        </Link>
      )}
    </div>
  )
}
