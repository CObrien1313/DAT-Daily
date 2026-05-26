'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, parseISO, differenceInCalendarDays } from 'date-fns'

interface DateNavigatorProps {
  date: string // yyyy-MM-dd
}

function localToday(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dateLabel(date: string, today: string): string {
  const current = parseISO(date + 'T12:00:00')
  const todayDate = parseISO(today + 'T12:00:00')
  const diff = differenceInCalendarDays(current, todayDate)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return format(current, 'EEEE')
}

export function DateNavigator({ date }: DateNavigatorProps) {
  const router = useRouter()
  const today = localToday()
  const current = parseISO(date + 'T12:00:00')
  const isToday = date === today

  function go(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const iso = `${y}-${m}-${day}`
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
          {dateLabel(date, today)}
        </p>
        <p className="text-xs text-slate-400">{format(current, 'MMMM d, yyyy')}</p>
      </div>

      <button
        onClick={() => go(addDays(current, 1))}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Next day"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isToday && (
        <button
          onClick={() => router.push('/tasks')}
          className="ml-2 text-xs text-indigo-600 hover:underline font-medium"
        >
          ↩ Today
        </button>
      )}
    </div>
  )
}
