'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { XPAction } from '@/lib/gamification'
import { ACHIEVEMENTS, type Achievement } from '@/lib/gamification'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface XPResult {
  xpEarned: number
  newXP: number
  oldLevel: number
  newLevel: number
  leveledUp: boolean
  newLevelTitle: string
  newAchievements: Achievement[]
}

export interface ToastItem {
  id: string
  xpEarned: number
  leveledUp: boolean
  newLevelTitle: string
  newAchievements: Achievement[]
}

interface XPContextValue {
  awardXP: (action: XPAction) => Promise<XPResult | null>
  toasts: ToastItem[]
  dismissToast: (id: string) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const XPContext = createContext<XPContextValue | null>(null)

export function useXP() {
  const ctx = useContext(XPContext)
  if (!ctx) throw new Error('useXP must be used inside XPProvider')
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function XPProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const awardXP = useCallback(async (action: XPAction): Promise<XPResult | null> => {
    try {
      const res = await fetch('/api/award-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) return null

      const result: XPResult = await res.json()

      // Resolve achievement objects from IDs
      const newAchievements = result.newAchievements ?? []

      // Add toast
      const id = `${Date.now()}-${Math.random()}`
      const toast: ToastItem = {
        id,
        xpEarned: result.xpEarned,
        leveledUp: result.leveledUp,
        newLevelTitle: result.newLevelTitle,
        newAchievements,
      }
      setToasts((prev) => [...prev, toast])

      // Auto-dismiss
      const delay = result.leveledUp || newAchievements.length > 0 ? 5000 : 3000
      setTimeout(() => dismissToast(id), delay)

      return result
    } catch {
      return null
    }
  }, [dismissToast])

  return (
    <XPContext.Provider value={{ awardXP, toasts, dismissToast }}>
      {children}
    </XPContext.Provider>
  )
}
