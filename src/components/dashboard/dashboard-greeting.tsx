'use client'

import { format } from 'date-fns'

interface DashboardGreetingProps {
  name: string
}

export function DashboardGreeting({ name }: DashboardGreetingProps) {
  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = format(now, 'EEEE, MMMM d')

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        {greeting}, {name} 👋
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        {dateStr} — stay consistent, stay ahead.
      </p>
    </div>
  )
}
