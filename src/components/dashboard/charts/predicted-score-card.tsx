import { cn } from '@/lib/utils'

interface PredictedScoreProps {
  predictedScore: number
  targetScore: number
  totalHours: number
  avgConfidence: number | null
  subjectsCovered: number
  totalSubjects: number
}

function ScorePill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg', color)}>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  )
}

export function PredictedScoreCard({
  predictedScore,
  targetScore,
  totalHours,
  avgConfidence,
  subjectsCovered,
  totalSubjects,
}: PredictedScoreProps) {
  const gap = Math.max(0, targetScore - predictedScore)
  const pct = Math.min(100, Math.round((predictedScore / targetScore) * 100))
  const onTrack = predictedScore >= targetScore

  let scoreColor = 'text-amber-500'
  if (onTrack) scoreColor = 'text-emerald-500'
  else if (gap <= 1) scoreColor = 'text-indigo-600'

  let barColor = 'bg-amber-400'
  if (onTrack) barColor = 'bg-emerald-500'
  else if (gap <= 1) barColor = 'bg-indigo-500'

  return (
    <div className="space-y-4">
      {/* Score display */}
      <div className="flex items-end gap-3">
        <div className="flex items-end gap-1">
          <span className={cn('text-6xl font-bold tracking-tight', scoreColor)}>
            {predictedScore}
          </span>
          <span className="text-slate-400 text-lg mb-2">/ 30</span>
        </div>
        <div className="mb-2 space-y-0.5">
          <p className="text-xs text-slate-500">Estimated AA score</p>
          <p className="text-xs text-slate-400">Target: {targetScore}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{pct}% toward target</span>
          {gap > 0 && <span>{gap.toFixed(1)} pts to go</span>}
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Factors row */}
      <div className="grid grid-cols-3 gap-2">
        <ScorePill
          label="Hours logged"
          value={`${totalHours}h`}
          color="bg-indigo-50"
        />
        <ScorePill
          label="Avg confidence"
          value={avgConfidence ? `${avgConfidence.toFixed(1)}/5` : '—'}
          color="bg-emerald-50"
        />
        <ScorePill
          label="Subjects covered"
          value={`${subjectsCovered}/${totalSubjects}`}
          color="bg-sky-50"
        />
      </div>

      {/* Context message */}
      <p className="text-xs text-slate-400 leading-relaxed italic">
        {onTrack
          ? `You're on pace for your target score of ${targetScore}. Keep going! 🎯`
          : `Study more and keep your confidence ratings high to close the ${gap.toFixed(1)}-point gap.`}
        {' '}This estimate updates as you log more sessions.
      </p>
    </div>
  )
}
