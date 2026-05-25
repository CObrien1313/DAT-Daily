import { Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress'

interface WeeklyHoursCardProps {
  completedHours: number
  goalHours: number
}

export function WeeklyHoursCard({ completedHours, goalHours }: WeeklyHoursCardProps) {
  const percentage = Math.min(100, Math.round((completedHours / goalHours) * 100))
  const remaining = Math.max(0, goalHours - completedHours)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Hours</CardTitle>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 mb-3">
          <span className="text-5xl font-extrabold leading-none text-slate-800">
            {completedHours}
          </span>
          <span className="text-slate-500 text-sm mb-1.5 ml-1">/ {goalHours}h</span>
        </div>
        <ProgressBar
          value={percentage}
          barClassName="bg-emerald-500"
          className="mb-2"
        />
        <p className="text-sm text-slate-500">
          {percentage >= 100
            ? '✅ Weekly goal reached!'
            : `${remaining}h left to reach your goal`}
        </p>
      </CardContent>
    </Card>
  )
}
