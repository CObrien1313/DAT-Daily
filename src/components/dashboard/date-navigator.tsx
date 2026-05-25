'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, parseISO } from 'date-fns'

interface DateNavigatorProps {
  date: string // yyyy-MM-dd
}

export function DateNavigator({ date }: DateNavigatorProps) {
  const router = useRouter()
  const current = parseISO(date + 'T12:00:00')
  const today = new Date().toISOString().split('T')[0]
  const isToday = date === today

  function go(d: Date) {
    const iso = d.toISOString().split('T')[0]
    if (iso === today) {
      router.push('/tasks')
    } else {
      router.push(`/tasks?date=${iso}`)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(subDays(current, 1))}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="text-center min-w-[160px]">
        <p className="text-sm font-semibold text-slate-800">
          {isToday ? 'Today' : format(current, 'EEEE')}
        </p>
        <p className="text-xs text-slate-400">{format(current, 'MMMM d, yyyy')}</p>
      </div>

      <button
        onClick={() => go(addDays(current, 1))}
        disabled={isToday}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Next day"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isToday && (
        <button
          onClick={() => router.push('/tasks')}
          className="ml-1 text-xs text-indigo-600 hover:underline font-medium"
        >
          Today
        </button>
      )}
    </div>
  )
}
