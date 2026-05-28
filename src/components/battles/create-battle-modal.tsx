'use client'

import { useState, useEffect } from 'react'
import { X, Search, ChevronRight, Loader2, Sword } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAvatarColor, getInitials } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import {
  BATTLE_TYPES,
  BATTLE_SUBJECTS,
  BATTLE_DURATIONS,
  BATTLE_XP,
  type BattleType,
  hasSubjectFilter,
} from '@/lib/battles'

interface Friend {
  id: string
  name: string
  username: string
  level: number
}

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function CreateBattleModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [friends, setFriends] = useState<Friend[]>([])
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [search, setSearch] = useState('')

  const [opponent, setOpponent]         = useState<Friend | null>(null)
  const [battleType, setBattleType]     = useState<BattleType>('combined')
  const [subject, setSubject]           = useState<string | null>(null)
  const [durationHours, setDuration]    = useState(72)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: fs } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      if (!fs?.length) { setLoadingFriends(false); return }

      const ids = fs.map((f) => f.requester_id === user.id ? f.addressee_id : f.requester_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, username, level')
        .in('id', ids)
        .not('username', 'is', null)

      setFriends((profiles ?? []) as Friend[])
      setLoadingFriends(false)
    }
    load()
  }, [])

  const filtered = friends.filter(
    (f) => !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase())
  )

  const showSubject = hasSubjectFilter(battleType)

  async function submit() {
    if (!opponent) return
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/battles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opponent_id: opponent.id,
        battle_type: battleType,
        subject: showSubject ? subject : null,
        duration_hours: durationHours,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError((body as { error?: string }).error ?? 'Failed to send challenge')
      setSubmitting(false)
      return
    }

    onCreated()
  }

  const typeInfo = BATTLE_TYPES.find((t) => t.id === battleType)!
  const durInfo  = BATTLE_DURATIONS.find((d) => d.hours === durationHours)!
  const subjInfo = BATTLE_SUBJECTS.find((s) => s.id === subject) ?? BATTLE_SUBJECTS[0]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sword className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {step === 1 ? 'Choose Opponent' : step === 2 ? 'Battle Setup' : 'Confirm Challenge'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step dots */}
        <div className="flex gap-1.5 px-5 py-3 flex-shrink-0">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn('h-1 flex-1 rounded-full transition-colors',
                s <= step ? 'bg-indigo-600' : 'bg-slate-100')}
            />
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">

          {/* ── Step 1: Select opponent ──────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search friends…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {loadingFriends && (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                </div>
              )}

              {!loadingFriends && friends.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-10">
                  Add friends with usernames first to challenge them.
                </p>
              )}

              {!loadingFriends && friends.length > 0 && filtered.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No match for &ldquo;{search}&rdquo;</p>
              )}

              <div className="space-y-2">
                {filtered.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setOpponent(f); setStep(2) }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0', getAvatarColor(f.id))}>
                      {getInitials(f.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{f.name}</p>
                      <p className="text-xs text-slate-400">@{f.username} · Lv.{f.level}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Battle setup ─────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Type */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Battle Type</p>
                <div className="space-y-2">
                  {BATTLE_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setBattleType(t.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left',
                        battleType === t.id
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <span className="text-xl leading-none flex-shrink-0">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                        <p className="text-xs text-slate-400">{t.description}</p>
                      </div>
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
                        battleType === t.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                      )} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject — only for study_time / combined */}
              {showSubject && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Subject <span className="font-normal normal-case">(optional)</span></p>
                  <div className="grid grid-cols-2 gap-2">
                    {BATTLE_SUBJECTS.map((s) => (
                      <button
                        key={String(s.id)}
                        onClick={() => setSubject(s.id)}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-colors',
                          subject === s.id
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        )}
                      >
                        <span>{s.emoji}</span>
                        <span className="truncate">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Duration</p>
                <div className="grid grid-cols-4 gap-2">
                  {BATTLE_DURATIONS.map((d) => (
                    <button
                      key={d.hours}
                      onClick={() => setDuration(d.hours)}
                      className={cn(
                        'py-2.5 rounded-xl border text-sm font-medium transition-colors',
                        durationHours === d.hours
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ──────────────────────────────────────── */}
          {step === 3 && opponent && (
            <div className="space-y-4">
              {/* VS banner */}
              <div className="flex items-center gap-3 py-2">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0', getAvatarColor(opponent.id))}>
                  {getInitials(opponent.name)}
                </div>
                <div className="flex-1 text-center text-2xl font-black text-slate-300">⚔️</div>
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 flex-shrink-0">
                  <span className="text-sm font-bold text-indigo-700">You</span>
                </div>
              </div>
              <p className="text-center text-sm text-slate-500">
                Challenging <span className="font-semibold text-slate-900">{opponent.name}</span>
              </p>

              <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">Battle type</span>
                  <span className="font-semibold">{typeInfo.emoji} {typeInfo.label}</span>
                </div>
                {showSubject && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">Subject</span>
                    <span className="font-semibold">{subjInfo.emoji} {subjInfo.label}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-semibold">{durInfo.label}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">Winner earns</span>
                  <span className="font-semibold text-indigo-600">+{BATTLE_XP.WIN} XP</span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-2 flex-shrink-0">
          {step === 1 ? (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => { setError(null); setStep((s) => (s - 1) as 1 | 2 | 3) }}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          )}

          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Preview →
            </button>
          )}

          {step === 3 && (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Sword className="w-4 h-4" />}
              {submitting ? 'Sending…' : 'Send Challenge'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
