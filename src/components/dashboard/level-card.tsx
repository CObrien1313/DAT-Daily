import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { getXPProgress } from '@/lib/gamification'

interface LevelCardProps {
  xp: number
}

export function LevelCard({ xp }: LevelCardProps) {
  const { level, pct, xpInLevel, xpToNext } = getXPProgress(xp)
  const isMax = level.maxXP === Infinity

  return (
    <Link href="/achievements" className="block">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-indigo-200 hover:shadow-sm transition-all h-full">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500 leading-none">Level {level.level}</p>
              <p className="text-sm font-bold text-slate-900 leading-snug mt-0.5">{level.title}</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg tabular-nums">
            {xp.toLocaleString()} XP
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {isMax
              ? 'Max level reached 🏆'
              : `${xpInLevel} / ${xpInLevel + xpToNext} XP · ${xpToNext} to Level ${level.level + 1}`}
          </p>
        </div>
      </div>
    </Link>
  )
}
