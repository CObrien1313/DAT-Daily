'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Sword, Loader2, Plus, CheckCircle, XCircle, Clock, Trophy } from 'lucide-react'
import { getAvatarColor, getInitials } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import { CreateBattleModal } from '@/components/battles/create-battle-modal'
import {
  formatTimeRemaining,
  getBattleTypeInfo,
  type BattleWithProfiles,
} from '@/lib/battles'

type Tab = 'active' | 'challenges' | 'history'

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
      <span className={cn(
        'text-xs px-2 py-0.5 rounded-full font-medium',
        isChallenger ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
      )}>
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
        won ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
      )}>
        {tie ? '🤝 Tie' : won ? '🏆 Won' : 'Lost'}
      </span>
    )
  }
  if (battle.status === 'declined') {
    return <span className="text-xs text-slate-400">Declined</span>
  }
  return null
}

export default function BattlesPage() {
  const [tab, setTab] = useState<Tab>('active')
  const [battles, setBattles] = useState<BattleWithProfiles[]>([])
  const [viewerId, setViewerId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [responding, setResponding] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Get current user id
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setViewerId(user.id)

      const res = await fetch('/api/battles')
      if (res.ok) setBattles(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function respond(battleId: string, action: 'accept' | 'decline') {
    setResponding(battleId)
    await fetch(`/api/battles/${battleId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await load()
    setResponding(null)
  }

  const active     = battles.filter((b) => b.status === 'active')
  const challenges = battles.filter((b) => b.status === 'pending' && b.opponent_id === viewerId)
  const sent       = battles.filter((b) => b.status === 'pending' && b.challenger_id === viewerId)
  const history    = battles.filter((b) => b.status === 'completed' || b.status === 'declined')

  const tabData: Record<Tab, BattleWithProfiles[]> = {
    active:     [...active, ...sent],
    challenges: challenges,
    history,
  }

  const currentBattles = tabData[tab]

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
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
        {([
          { id: 'active' as Tab,     label: `Active${active.length + sent.length > 0 ? ` (${active.length + sent.length})` : ''}` },
          { id: 'challenges' as Tab, label: `Challenges${challenges.length > 0 ? ` (${challenges.length})` : ''}` },
          { id: 'history' as Tab,    label: 'History' },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
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

      {!loading && currentBattles.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <Sword className="w-8 h-8 mx-auto mb-3 text-slate-200" />
          <p className="text-sm">
            {tab === 'active'     && 'No active battles. Challenge a friend!'}
            {tab === 'challenges' && 'No pending challenges from friends.'}
            {tab === 'history'    && 'No completed battles yet.'}
          </p>
        </div>
      )}

      {!loading && currentBattles.length > 0 && (
        <div className="space-y-3">
          {currentBattles.map((b) => {
            if (!b.challenger || !b.opponent) return null
            const opponentProfile = b.challenger_id === viewerId ? b.opponent : b.challenger
            const typeInfo = getBattleTypeInfo(b.battle_type)
            const isPending = b.status === 'pending'
            const isChallenge = isPending && b.opponent_id === viewerId
            const isSent = isPending && b.challenger_id === viewerId

            return (
              <div
                key={b.id}
                className={cn(
                  'p-4 rounded-xl border transition-colors',
                  isChallenge ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'
                )}
              >
                <div className="flex items-center gap-3">
                  {b.status === 'active'
                    ? <Link href={`/battles/${b.id}`}><Avatar id={opponentProfile.id} name={opponentProfile.name} /></Link>
                    : <Avatar id={opponentProfile.id} name={opponentProfile.name} />
                  }

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">
                        {isChallenge ? `${b.challenger.name} challenged you` : opponentProfile.name}
                      </p>
                      <StatusBadge battle={b} viewerId={viewerId} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {typeInfo.emoji} {typeInfo.label}
                      {b.subject ? ` · ${b.subject}` : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  {b.status === 'active' && (
                    <Link
                      href={`/battles/${b.id}`}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      View →
                    </Link>
                  )}

                  {isSent && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  )}

                  {isChallenge && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => respond(b.id, 'accept')}
                        disabled={responding === b.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {responding === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Accept
                      </button>
                      <button
                        onClick={() => respond(b.id, 'decline')}
                        disabled={responding === b.id}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {b.status === 'completed' && (
                    <Link
                      href={`/battles/${b.id}`}
                      className="flex-shrink-0 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      Details →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreateBattleModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load() }}
        />
      )}
    </div>
  )
}
