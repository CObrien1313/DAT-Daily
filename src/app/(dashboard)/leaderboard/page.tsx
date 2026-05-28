'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Trophy, Loader2, Users, Globe, Crown } from 'lucide-react'
import { getAvatarColor, getInitials } from '@/lib/avatar'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = 'hours' | 'streak' | 'questions' | 'accuracy'
type Scope = 'global' | 'friends'

interface LeaderboardRow {
  rank: number
  user_id: string
  name: string
  username: string
  school: string | null
  level: number
  value: number
  is_viewer: boolean
}

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORIES: { id: Category; label: string; unit: string; emoji: string }[] = [
  { id: 'hours',     label: 'Study Hours',  unit: 'hrs',   emoji: '⏱️' },
  { id: 'streak',    label: 'Streak',       unit: 'days',  emoji: '🔥' },
  { id: 'questions', label: 'Questions',    unit: 'ans',   emoji: '❓' },
  { id: 'accuracy',  label: 'Accuracy',     unit: '%',     emoji: '🎯' },
]

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ userId, name }: { userId: string; name: string }) {
  const color = getAvatarColor(userId)
  return (
    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0', color)}>
      {getInitials(name)}
    </div>
  )
}

// ── Rank badge ────────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg leading-none">🥇</span>
  if (rank === 2) return <span className="text-lg leading-none">🥈</span>
  if (rank === 3) return <span className="text-lg leading-none">🥉</span>
  return <span className="text-sm font-bold text-slate-400 w-6 text-center">{rank}</span>
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [category, setCategory] = useState<Category>('hours')
  const [scope, setScope] = useState<Scope>('global')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/leaderboard?category=${category}&scope=${scope}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Failed to load leaderboard')
        setRows([])
      } else {
        setRows(await res.json())
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }, [category, scope])

  useEffect(() => { load() }, [load])

  const activeCat = CATEGORIES.find((c) => c.id === category)!

  function formatValue(val: number): string {
    if (category === 'hours') return val.toFixed(1)
    if (category === 'accuracy') return val.toFixed(1)
    return String(Math.round(val))
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
        <span className="ml-auto text-xs text-slate-400">Resets weekly</span>
      </div>

      {/* Scope toggle */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
        <button
          onClick={() => setScope('global')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors',
            scope === 'global' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Globe className="w-3.5 h-3.5" />
          Global
        </button>
        <button
          onClick={() => setScope('friends')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors',
            scope === 'friends' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Users className="w-3.5 h-3.5" />
          Friends
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
              category === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
            )}
          >
            <span className="text-base leading-none">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          <p className="text-xs text-slate-400 mt-3">
            This feature requires a database function. See the SQL setup guide below.
          </p>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <Crown className="w-8 h-8 mx-auto mb-3 text-slate-200" />
          <p className="text-sm">
            {scope === 'friends'
              ? 'No friends with a username yet. Add friends with usernames to see them here.'
              : 'No data yet. Start studying to appear on the leaderboard!'}
          </p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.user_id}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors',
                row.is_viewer
                  ? 'bg-indigo-50 border-indigo-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              )}
            >
              {/* Rank */}
              <div className="w-7 flex items-center justify-center flex-shrink-0">
                <RankBadge rank={row.rank} />
              </div>

              {/* Avatar */}
              <Link href={`/profile/${row.username}`}>
                <Avatar userId={row.user_id} name={row.name} />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${row.username}`} className="hover:underline">
                  <p className={cn('text-sm font-semibold truncate', row.is_viewer ? 'text-indigo-900' : 'text-slate-900')}>
                    {row.name}
                    {row.is_viewer && <span className="ml-1.5 text-xs font-normal text-indigo-500">(you)</span>}
                  </p>
                </Link>
                <p className="text-xs text-slate-400 truncate">
                  @{row.username}
                  {row.school ? ` · ${row.school}` : ''}
                  {' · '}Lv.{row.level}
                </p>
              </div>

              {/* Value */}
              <div className="flex-shrink-0 text-right">
                <p className={cn('text-base font-bold', row.is_viewer ? 'text-indigo-700' : 'text-slate-900')}>
                  {formatValue(row.value)}
                </p>
                <p className="text-xs text-slate-400">{activeCat.unit}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
