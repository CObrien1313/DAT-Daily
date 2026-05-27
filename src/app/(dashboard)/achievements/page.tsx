import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ACHIEVEMENTS, getXPProgress } from '@/lib/gamification'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: rawAchievements }] = await Promise.all([
    supabase.from('profiles').select('xp, level').eq('id', user.id).single(),
    supabase
      .from('user_achievements')
      .select('achievement_id, earned_at')
      .eq('user_id', user.id),
  ])

  const xp: number = profile?.xp ?? 0
  const { level, pct, xpInLevel, xpToNext } = getXPProgress(xp)
  const isMax = level.maxXP === Infinity

  // Map achievement_id → earned_at
  const earnedMap = new Map<string, string>()
  for (const a of rawAchievements ?? []) {
    earnedMap.set(a.achievement_id, a.earned_at)
  }

  const earnedCount = earnedMap.size
  const totalCount = ACHIEVEMENTS.length

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Achievements</h1>
        </div>
        <p className="text-sm text-slate-500">
          Track your progress and unlock badges as you study.
        </p>
      </div>

      {/* Level card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold opacity-80">Current Level</p>
            <p className="text-3xl font-bold">{level.level} · {level.title}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">{xp.toLocaleString()}</p>
            <p className="text-sm opacity-70">total XP</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs opacity-80">
            <span>{xpInLevel} XP in this level</span>
            {!isMax && <span>{xpToNext} XP to Level {level.level + 1}</span>}
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{earnedCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Achievements Earned</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{totalCount - earnedCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Still to Unlock</p>
        </div>
      </div>

      {/* Achievement grid */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          All Achievements ({earnedCount}/{totalCount})
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const earnedAt = earnedMap.get(achievement.id)
            const earned = !!earnedAt
            return (
              <div
                key={achievement.id}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border transition-all',
                  earned
                    ? 'bg-white border-indigo-200 shadow-sm'
                    : 'bg-slate-50 border-slate-200 opacity-60',
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
                  earned ? 'bg-indigo-50' : 'bg-slate-100 grayscale',
                )}>
                  {achievement.emoji}
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    'text-sm font-semibold',
                    earned ? 'text-slate-900' : 'text-slate-500',
                  )}>
                    {achievement.title}
                  </p>
                  <p className="text-xs text-slate-400 leading-snug mt-0.5">
                    {achievement.description}
                  </p>
                  {earned && earnedAt && (
                    <p className="text-xs text-indigo-500 font-medium mt-1">
                      Earned {format(new Date(earnedAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                {earned && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ml-auto">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
