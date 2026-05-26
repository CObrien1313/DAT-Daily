import { Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StreakCardProps {
  streakDays: number
  longestStreak: number
}

export function StreakCard({ streakDays, longestStreak }: StreakCardProps) {
  const isHot = streakDays >= 7
  const isActive = streakDays > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Study Streak</CardTitle>
          <Flame
            className={cn(
              'w-4 h-4 transition-colors',
              isHot ? 'text-orange-500 animate-bounce' : isActive ? 'text-orange-400' : 'text-slate-300'
            )}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 mb-1">
          <span
            className={cn(
              'text-5xl font-extrabold leading-none tabular-nums transition-colors',
              isHot ? 'text-orange-500' : isActive ? 'text-slate-700' : 'text-slate-300'
            )}
          >
            {streakDays}
          </span>
          <span className="text-slate-500 text-sm mb-1.5 ml-1">
            {streakDays === 1 ? 'day' : 'days'}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {streakDays === 0
            ? 'Log a session to start your streak!'
            : streakDays >= 30
            ? '🏆 Legendary. Absolutely unstoppable.'
            : streakDays >= 14
            ? '🔥 Two weeks straight — elite territory!'
            : streakDays >= 7
            ? "🔥 You're on fire! Keep it up."
            : streakDays >= 3
            ? '⚡ Building momentum — don\'t stop now!'
            : 'Keep going — don\'t break the chain!'}
        </p>
        {longestStreak > 0 && (
          <p className="text-xs text-slate-400 mt-1">Personal best: {longestStreak} days</p>
        )}
      </CardContent>
    </Card>
  )
}
