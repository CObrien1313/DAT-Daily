'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, parseISO, differenceInCalendarDays } from 'date-fns'

interface DateNavigatorProps {
  date: string  // yyyy-MM-dd — the currently viewed date
  today: string // yyyy-MM-dd — passed from the server so client always agrees
}

function dateLabel(date: string, today: string): string {
  const diff = differenceInCalendarDays(
    parseISO(date + 'T12:00:00'),
    parseISO(today + 'T12:00:00')
  )
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return format(parseISO(date + 'T12:00:00'), 'EEEE')
}

function toHref(date: string, today: string): string {
  return date === today ? '/tasks' : `/tasks?date=${date}`
}

export function DateNavigator({ date, today }: DateNavigatorProps) {
  const current = parseISO(date + 'T12:00:00')
  const isToday = date === today

  const prevDate = format(subDays(current, 1), 'yyyy-MM-dd')
  const nextDate = format(addDays(current, 1), 'yyyy-MM-dd')

  return (
    <div className="flex items-center gap-2">
      {/* Back arrow — always enabled, no restriction */}
      <Link
        href={toHref(prevDate, today)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-4 h-4" />
      </Link>

      <div className="text-center min-w-[160px]">
        <p className="text-sm font-semibold text-slate-800">
          {dateLabel(date, today)}
        </p>
        <p className="text-xs text-slate-400">
          {format(current, 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Forward arrow — always enabled */}
      <Link
        href={toHref(nextDate, today)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Next day"
      >
        <ChevronRight className="w-4 h-4" />
      </Link>

      {/* Today button — only shown when not on today */}
      {!isToday && (
        <Link
          href="/tasks"
          className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Today
        </Link>
      )}
    </div>
  )
}
