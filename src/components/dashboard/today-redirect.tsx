'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function TodayRedirect() {
  const router = useRouter()

  useEffect(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    router.replace(`/tasks?date=${y}-${m}-${d}`)
  }, [router])

  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
