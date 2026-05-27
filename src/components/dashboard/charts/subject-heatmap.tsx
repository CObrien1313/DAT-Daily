import { cn } from '@/lib/utils'

interface HeatmapProps {
  weekLabels: string[]
  rows: { subject: string; cells: number[] }[]
}

function cellStyle(hours: number): string {
  if (hours === 0) return 'bg-slate-100 text-slate-300'
  if (hours < 0.5) return 'bg-indigo-100 text-indigo-500'
  if (hours < 1.5) return 'bg-indigo-200 text-indigo-700'
  if (hours < 3) return 'bg-indigo-400 text-white'
  return 'bg-indigo-600 text-white'
}

export function SubjectHeatmap({ weekLabels, rows }: HeatmapProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-left text-xs text-slate-400 font-normal pb-1 w-36 min-w-[120px]" />
            {weekLabels.map((wk) => (
              <th
                key={wk}
                className="text-center text-[10px] text-slate-400 font-normal pb-1 min-w-[44px]"
              >
                {wk}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ subject, cells }) => (
            <tr key={subject}>
              <td className="text-xs text-slate-600 pr-2 py-0 truncate max-w-[120px] align-middle">
                {subject}
              </td>
              {cells.map((hrs, i) => (
                <td key={i} className="p-0">
                  <div
                    className={cn(
                      'rounded text-center text-[10px] font-semibold py-1.5 leading-none',
                      cellStyle(hrs)
                    )}
                    title={hrs > 0 ? `${hrs}h` : 'no sessions'}
                  >
                    {hrs >= 0.5 ? `${hrs}h` : ''}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-[10px] text-slate-400">0h</span>
        {[0, 0.3, 1, 2, 3.5].map((hrs, i) => (
          <div key={i} className={cn('w-4 h-4 rounded', cellStyle(hrs))} />
        ))}
        <span className="text-[10px] text-slate-400">3h+</span>
      </div>
    </div>
  )
}
