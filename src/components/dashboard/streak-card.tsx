import { Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StreakCardProps {
  streakDays: number
  longestStreak: number
}

export function StreakCard({ streakDays, longestStreak }: StreakCardProps) {
  const isHot = streakDays >= 7

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Study Streak</CardTitle>
          <Flame className={cn('w-4 h-4', isHot ? 'text-orange-500' : 'text-slate-400')} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 mb-1">
          <span className={cn('text-5xl font-extrabold leading-none', isHot ? 'text-orange-500' : 'text-slate-700')}>
            {streakDays}
          </span>
          <span className="text-slate-500 text-sm mb-1.5 ml-1">
            {streakDays === 1 ? 'day' : 'days'}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {streakDays === 0
            ? 'Start studying to begin your streak!'
            : streakDays >= 7
            ? '🔥 You\'re on fire! Keep it up.'
            : 'Keep going — don\'t break the chain!'}
        </p>
        <p className="text-xs text-slate-400 mt-1">Personal best: {longestStreak} days</p>
      </CardContent>
    </Card>
  )
}
