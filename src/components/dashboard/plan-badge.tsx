'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import type { Plan } from '@/lib/subscription'

export function PlanBadge() {
  const [plan, setPlan] = useState<Plan | null>(null)

  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.plan) setPlan(d.plan as Plan) })
      .catch(() => {})
  }, [])

  if (plan === null) return null

  if (plan === 'pro') {
    return (
      <Link href="/upgrade" className="mx-2 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-colors">
        <span className="text-sm">✨</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-400 leading-none">PRO</p>
          <p className="text-[10px] text-amber-500/70 mt-0.5">All features unlocked</p>
        </div>
      </Link>
    )
  }

  return (
    <div className="mx-2 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 leading-none">FREE plan</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Limited AI & battles</p>
      </div>
      <Link
        href="/upgrade"
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-400 transition-colors text-[10px] font-bold text-white whitespace-nowrap flex-shrink-0"
      >
        <Zap className="w-2.5 h-2.5" />
        Go Pro
      </Link>
    </div>
  )
}
