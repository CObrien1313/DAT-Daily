import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number // 0–100
  className?: string
  barClassName?: string
  showLabel?: boolean
}

export function ProgressBar({ value, className, barClassName, showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barClassName ?? 'bg-indigo-500')}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-500 w-8 text-right">{clamped}%</span>
      )}
    </div>
  )
}
