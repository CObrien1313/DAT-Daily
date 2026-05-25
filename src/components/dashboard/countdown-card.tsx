'use client'

import { useEffect, useState } from 'react'
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CountdownCardProps {
  examDate: string | null
}

export function CountdownCard({ examDate }: CountdownCardProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  if (!examDate) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exam Countdown</CardTitle>
            <CalendarDays className="w-4 h-4 text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-sm mb-3">No exam date set yet.</p>
          <Link
            href="/settings"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Set your exam date →
          </Link>
        </CardContent>
      </Card>
    )
  }

  const target = new Date(examDate + 'T09:00:00')
  const daysLeft = differenceInDays(target, now)
  const hoursLeft = differenceInHours(target, now) % 24
  const minutesLeft = differenceInMinutes(target, now) % 60
  const isPast = daysLeft < 0

  const urgencyClass =
    daysLeft <= 14
      ? 'text-red-600'
      : daysLeft <= 30
      ? 'text-orange-500'
      : daysLeft <= 60
      ? 'text-amber-500'
      : 'text-indigo-600'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Exam Countdown</CardTitle>
          <CalendarDays className="w-4 h-4 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent>
        {isPast ? (
          <p className="text-2xl font-bold text-slate-500">Exam passed</p>
        ) : (
          <>
            <div className="flex items-end gap-1 mb-1">
              <span className={cn('text-5xl font-extrabold leading-none', urgencyClass)}>
                {daysLeft}
              </span>
              <span className="text-slate-500 text-sm mb-1.5 ml-1">days</span>
            </div>
            <p className="text-sm text-slate-500">
              {hoursLeft}h {minutesLeft}m remaining
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Exam: {new Date(examDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
