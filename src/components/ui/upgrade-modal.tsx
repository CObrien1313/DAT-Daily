'use client'

import { X, Zap, CheckCircle2 } from 'lucide-react'

const PRO_PERKS = [
  'Unlimited AI schedule recreations',
  'Unlimited recovery plan generations',
  'Unlimited 1v1 battles per day',
  'Up to 30-question Quiz Duels (vs 10 free)',
]

interface Props {
  message: string
  onClose: () => void
}

export function UpgradeModal({ message, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

        {/* Gold header */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-semibold tracking-wide uppercase">DAT Daily Pro</span>
          </div>
          <p className="text-xl font-bold leading-snug">Unlock your full potential</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Trigger message */}
          <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            {message}
          </p>

          {/* Perks list */}
          <div className="space-y-2">
            {PRO_PERKS.map((perk) => (
              <div key={perk} className="flex items-start gap-2.5 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{perk}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-2 pt-1">
            <a
              href="mailto:obrienconor632@gmail.com?subject=DAT%20Daily%20Pro%20Access&body=Hi%2C%20I%27d%20like%20to%20upgrade%20to%20DAT%20Daily%20Pro!"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Zap className="w-4 h-4" />
              Request Pro Access
            </a>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
