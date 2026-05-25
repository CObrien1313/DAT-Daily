'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronDown, ChevronUp, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DATSubject } from '@/lib/types'

interface Session {
  id: string
  subject: string
  duration_minutes: number
  date: string
  confidence: number | null
  productivity: number | null
  notes: string | null
}

interface SessionHistoryProps {
  sessions: Session[]
  totalHours: number
}

const SUBJECT_BADGE_VARIANT: Record<DATSubject, 'default' | 'success' | 'info' | 'warning'> = {
  Biology: 'success',
  'General Chemistry': 'info',
  'Organic Chemistry': 'default',
  PAT: 'warning',
  'Reading Comprehension': 'info',
  'Quantitative Reasoning': 'default',
}

function StarDisplay({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
          )}
        />
      ))}
    </div>
  )
}

function SessionRow({ session }: { session: Session }) {
  const [open, setOpen] = useState(false)
  const hasDetails = session.confidence || session.productivity || session.notes

  return (
    <li className="border border-slate-100 rounded-lg overflow-hidden">
      <button
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
          hasDetails ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
        )}
        onClick={() => hasDetails && setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant={SUBJECT_BADGE_VARIANT[session.subject as DATSubject] ?? 'default'}>
            {session.subject}
          </Badge>
          <span className="text-sm text-slate-600 truncate">
            {format(parseISO(session.date + 'T12:00:00'), 'MMM d, yyyy')}
          </span>
          {session.confidence && (
            <StarDisplay value={session.confidence} />
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-sm font-medium text-slate-700">{session.duration_minutes}m</span>
          {hasDetails && (
            open
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {open && hasDetails && (
        <div className="px-4 pb-4 pt-1 bg-slate-50 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {session.confidence && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Confidence</p>
                <div className="flex items-center gap-1.5">
                  <StarDisplay value={session.confidence} />
                  <span className="text-xs text-slate-500">{session.confidence}/5</span>
                </div>
              </div>
            )}
            {session.productivity && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Productivity</p>
                <div className="flex items-center gap-1.5">
                  <StarDisplay value={session.productivity} />
                  <span className="text-xs text-slate-500">{session.productivity}/5</span>
                </div>
              </div>
            )}
          </div>
          {session.notes && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700 leading-relaxed">{session.notes}</p>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export function SessionHistory({ sessions, totalHours }: SessionHistoryProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-800">Study History</h2>
        <span className="text-sm text-slate-500">{totalHours}h logged total</span>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">
          No sessions logged yet. Use &quot;Log Session&quot; on your dashboard!
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </ul>
      )}
    </div>
  )
}
