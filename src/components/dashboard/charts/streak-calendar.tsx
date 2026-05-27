import { cn } from '@/lib/utils'

interface CalendarDay {
  date: string
  minutes: number
  isFuture: boolean
}

const DAY_LABELS = ['M', '', 'W', '', 'F', '', 'S']

function cellColor(minutes: number, isFuture: boolean) {
  if (isFuture) return 'bg-slate-50 border border-slate-100'
  if (minutes === 0) return 'bg-slate-100'
  if (minutes < 30) return 'bg-indigo-200'
  if (minutes < 60) return 'bg-indigo-400'
  if (minutes < 120) return 'bg-indigo-500'
  return 'bg-indigo-700'
}

function tooltip(day: CalendarDay) {
  if (day.isFuture) return day.date
  const hrs = Math.round((day.minutes / 60) * 10) / 10
  return day.minutes > 0 ? `${day.date}: ${hrs}h studied` : `${day.date}: no session`
}

export function StreakCalendar({ days }: { days: CalendarDay[] }) {
  // days is a flat array ordered Mon→Sun for 13 weeks (91 days)
  // Transpose into weeks (columns) × days-of-week (rows)
  const numWeeks = Math.ceil(days.length / 7)

  // Collect month label positions
  const monthLabels: { weekIdx: number; label: string }[] = []
  for (let w = 0; w < numWeeks; w++) {
    const day = days[w * 7]
    if (!day) continue
    const d = new Date(day.date + 'T12:00:00')
    if (d.getDate() <= 7) {
      monthLabels.push({ weekIdx: w, label: d.toLocaleString('en-US', { month: 'short' }) })
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1.5 min-w-fit">
        {/* Day-of-week labels column */}
        <div className="flex flex-col gap-1 pt-5">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-3.5 flex items-center">
              <span className="text-[10px] text-slate-400 w-3 text-right leading-none">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar columns */}
        <div className="flex flex-col gap-0">
          {/* Month labels row */}
          <div className="flex gap-1 h-5 items-end mb-1 relative">
            {Array.from({ length: numWeeks }).map((_, w) => {
              const ml = monthLabels.find((m) => m.weekIdx === w)
              return (
                <div key={w} className="w-3.5 flex-shrink-0">
                  {ml && (
                    <span className="text-[10px] text-slate-400 absolute">{ml.label}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Grid: row per day-of-week */}
          {Array.from({ length: 7 }).map((_, row) => (
            <div key={row} className="flex gap-1 mb-1">
              {Array.from({ length: numWeeks }).map((_, col) => {
                const idx = col * 7 + row
                const day = days[idx]
                if (!day) return <div key={col} className="w-3.5 h-3.5 flex-shrink-0" />
                return (
                  <div
                    key={col}
                    className={cn('w-3.5 h-3.5 rounded-sm flex-shrink-0', cellColor(day.minutes, day.isFuture))}
                    title={tooltip(day)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-slate-400">Less</span>
        {[0, 20, 45, 90, 150].map((mins) => (
          <div key={mins} className={cn('w-3 h-3 rounded-sm', cellColor(mins, false))} />
        ))}
        <span className="text-[10px] text-slate-400">More</span>
      </div>
    </div>
  )
}
