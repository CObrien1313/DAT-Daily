import Link from 'next/link'
import { Flame, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DailyQuestionStreakCardProps {
  questionStreak: number
  totalCorrect: number
  totalWrong: number
}

export function DailyQuestionStreakCard({
  questionStreak,
  totalCorrect,
  totalWrong,
}: DailyQuestionStreakCardProps) {
  const totalAnswered = totalCorrect + totalWrong
  const pct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null
  const isActive = questionStreak > 0

  return (
    <Link href="/questions" className="block h-full">
      <Card className="hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer h-full">
        <CardContent className="p-4 flex flex-col gap-3">
          {/* Label row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className={cn('w-4 h-4', isActive ? 'text-orange-500' : 'text-slate-300')} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Daily Question
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </div>

          {/* Streak number */}
          <div className="flex items-end gap-1">
            <span className={cn('text-3xl font-bold', isActive ? 'text-slate-900' : 'text-slate-400')}>
              {questionStreak}
            </span>
            <span className="text-sm text-slate-500 mb-0.5">day streak</span>
          </div>

          {/* Accuracy sub-line */}
          {pct !== null ? (
            <p className="text-xs text-slate-400">
              {pct}% accuracy &middot; {totalAnswered} answered
            </p>
          ) : (
            <p className="text-xs text-indigo-500 font-medium">Answer today →</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
