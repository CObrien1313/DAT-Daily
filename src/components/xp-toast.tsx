'use client'

import { useXP, type ToastItem } from '@/contexts/xp-context'
import { cn } from '@/lib/utils'
import { X, Zap } from 'lucide-react'

function Toast({ toast }: { toast: ToastItem }) {
  const { dismissToast } = useXP()
  const firstAchievement = toast.newAchievements[0]

  return (
    <div
      className={cn(
        'flex items-start gap-3 w-72 p-4 rounded-2xl shadow-xl border text-white',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        toast.leveledUp
          ? 'bg-gradient-to-br from-indigo-600 to-violet-600 border-indigo-400/30'
          : 'bg-slate-900 border-slate-700/50',
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg',
        toast.leveledUp ? 'bg-white/20' : 'bg-indigo-500/30',
      )}>
        {firstAchievement ? firstAchievement.emoji : <Zap className="w-4 h-4 text-amber-300" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-amber-300">+{toast.xpEarned} XP</span>
          {toast.leveledUp && (
            <span className="text-xs font-semibold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
              Level Up!
            </span>
          )}
        </div>

        {toast.leveledUp && (
          <p className="text-sm font-semibold mt-0.5 truncate">
            🎉 {toast.newLevelTitle}
          </p>
        )}

        {firstAchievement && (
          <p className="text-xs text-white/70 mt-0.5 truncate">
            Achievement: {firstAchievement.title}
          </p>
        )}

        {!toast.leveledUp && !firstAchievement && (
          <p className="text-xs text-white/50 mt-0.5">Keep it up!</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => dismissToast(toast.id)}
        className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors -mt-0.5 -mr-0.5 p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/** Drop this inside XPProvider (already in layout) — renders floating toasts */
export function XPToastStack() {
  const { toasts } = useXP()
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  )
}
