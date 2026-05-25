import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress'
import { SUBJECT_COLORS } from '@/lib/types'
import type { SubjectProgress } from '@/lib/types'

interface SubjectProgressCardProps {
  subjects: SubjectProgress[]
}

export function SubjectProgressCard({ subjects }: SubjectProgressCardProps) {
  const sorted = [...subjects].sort((a, b) => a.progress - b.progress)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subject Progress</CardTitle>
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {sorted.map(({ subject, progress }) => (
          <div key={subject}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-700">{subject}</span>
              <span className="text-xs font-semibold text-slate-500">{progress}%</span>
            </div>
            <ProgressBar
              value={progress}
              barClassName={SUBJECT_COLORS[subject]}
              showLabel={false}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
