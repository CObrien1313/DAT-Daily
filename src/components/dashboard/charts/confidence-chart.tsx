'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface DataPoint {
  week: string
  avg: number | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length || payload[0].value == null) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="font-semibold text-slate-700 mb-0.5">{label}</p>
      <p className="text-emerald-600">{Number(payload[0].value).toFixed(1)} / 5 confidence</p>
    </div>
  )
}

export function ConfidenceChart({ data }: { data: DataPoint[] }) {
  const hasData = data.some((d) => d.avg !== null)
  if (!hasData) {
    return (
      <p className="text-sm text-slate-400 py-8 text-center">
        Rate your sessions to start tracking confidence trends.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine y={3} stroke="#e2e8f0" strokeDasharray="4 4" label="" />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0' }} />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#059669' }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
