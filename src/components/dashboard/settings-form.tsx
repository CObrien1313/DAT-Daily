'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SettingsFormProps {
  profile: {
    name: string
    exam_date: string | null
    weekly_hours_goal: number
  }
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState(profile.name ?? '')
  const [examDate, setExamDate] = useState(profile.exam_date ?? '')
  const [weeklyHours, setWeeklyHours] = useState(profile.weekly_hours_goal ?? 30)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        exam_date: examDate || null,
        weekly_hours_goal: weeklyHours,
      })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className={inputClass}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DAT Exam</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Exam date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={inputClass}
            />
            <p className="text-xs text-slate-400 mt-1.5">
              This powers your countdown timer on the dashboard.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Weekly study hours goal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={168}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className={inputClass}
              />
              <span className="text-sm text-slate-500 whitespace-nowrap">hrs / week</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Recommended: 20–35 hours/week for most test schedules.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Saving…' : 'Save changes'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Saved!
          </span>
        )}
      </div>
    </form>
  )
}
