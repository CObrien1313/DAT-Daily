'use client'

import { useEffect, useState } from 'react'
import { Zap, CheckCircle2, X, Sparkles, Sword, Calendar, BookOpen } from 'lucide-react'
import type { Plan } from '@/lib/subscription'

interface UsageData {
  plan: Plan
  schedules: { used: number; limit: number }
  recovery:  { used: number; limit: number }
  battles:   { used: number; limit: number }
}

const FREE_FEATURES = [
  { icon: Calendar,  text: 'AI study schedule — 1 per week' },
  { icon: Zap,       text: 'Recovery plans — 1 per week' },
  { icon: Sword,     text: '1v1 battles — 1 per day' },
  { icon: BookOpen,  text: 'Quiz Duels — 10 questions max' },
]

const PRO_FEATURES = [
  'Unlimited AI schedule recreations',
  'Unlimited recovery plan generations',
  'Unlimited 1v1 battles per day',
  'Quiz Duels up to 30 questions',
  'Priority support',
]

export default function UpgradePage() {
  const [usage, setUsage] = useState<UsageData | null>(null)

  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setUsage(d) })
      .catch(() => {})
  }, [])

  const isPro = usage?.plan === 'pro'

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-amber-500" />
          <h1 className="text-2xl font-bold text-slate-900">
            {isPro ? 'You\'re on Pro ✨' : 'Upgrade to Pro'}
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          {isPro
            ? 'You have full access to all DAT Daily features.'
            : 'Unlock unlimited AI tools and competitive features.'}
        </p>
      </div>

      {/* Current plan card */}
      {usage && (
        <div className={`rounded-2xl border p-5 mb-6 ${isPro ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-0.5">Current plan</p>
              <div className="flex items-center gap-2">
                {isPro
                  ? <span className="text-lg font-black text-amber-600">✨ PRO</span>
                  : <span className="text-lg font-black text-slate-700">FREE</span>}
              </div>
            </div>
            {isPro && (
              <div className="px-3 py-1 bg-amber-100 rounded-full">
                <span className="text-xs font-bold text-amber-700">Active</span>
              </div>
            )}
          </div>

          {/* Usage meters (free users only) */}
          {!isPro && (
            <div className="space-y-3">
              {[
                { label: 'AI Schedules this week',    used: usage.schedules.used, limit: usage.schedules.limit },
                { label: 'Recovery Plans this week',  used: usage.recovery.used,  limit: usage.recovery.limit  },
                { label: 'Battles today',             used: usage.battles.used,   limit: usage.battles.limit   },
              ].map(({ label, used, limit }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{label}</span>
                    <span className={used >= limit ? 'text-red-500 font-semibold' : 'font-medium'}>
                      {used} / {limit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${used >= limit ? 'bg-red-400' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Free column */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-bold text-slate-700 mb-1">Free</p>
          <p className="text-2xl font-black text-slate-900 mb-4">$0</p>
          <div className="space-y-2.5">
            {FREE_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-2 text-xs text-slate-500">
                <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                <span>{text}</span>
              </div>
            ))}
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Priority support</span>
            </div>
          </div>
        </div>

        {/* Pro column */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">BEST</span>
          </div>
          <p className="text-sm font-bold mb-1 opacity-90">Pro</p>
          <div className="mb-4">
            <span className="text-2xl font-black">$9.99</span>
            <span className="text-sm opacity-75"> / mo</span>
          </div>
          <div className="space-y-2.5">
            {PRO_FEATURES.map((text) => (
              <div key={text} className="flex items-start gap-2 text-xs text-white">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/80" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      {!isPro ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4">
          <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
          <div>
            <p className="text-base font-bold text-slate-900 mb-1">Ready to go Pro?</p>
            <p className="text-sm text-slate-500">
              Payments launching soon. Join the waitlist and get notified when Pro goes live — early users get a discount.
            </p>
          </div>
          <a
            href="mailto:obrienconor632@gmail.com?subject=DAT%20Daily%20Pro%20-%20Early%20Access&body=Hi%2C%20I%27d%20like%20to%20be%20notified%20when%20DAT%20Daily%20Pro%20launches!"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Zap className="w-4 h-4" />
            Join the Pro Waitlist
          </a>
          <p className="text-xs text-slate-400">No commitment. We&apos;ll email you when it launches.</p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 text-center space-y-2">
          <p className="text-base font-bold text-slate-900">You&apos;re all set! ✨</p>
          <p className="text-sm text-slate-500">
            Enjoy unlimited AI planning, recovery plans, and battles. Thanks for supporting DAT Daily!
          </p>
        </div>
      )}
    </div>
  )
}
