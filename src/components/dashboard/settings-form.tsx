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
    username: string | null
    school: string | null
    exam_date: string | null
    weekly_hours_goal: number
  }
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState(profile.name ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [school, setSchool] = useState(profile.school ?? '')
  const [examDate, setExamDate] = useState(profile.exam_date ?? '')
  const [weeklyHours, setWeeklyHours] = useState(profile.weekly_hours_goal ?? 30)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  function validateUsername(val: string): string | null {
    if (!val) return null // optional
    if (val.length < 3) return 'Username must be at least 3 characters'
    if (val.length > 24) return 'Username must be 24 characters or fewer'
    if (!/^[a-z0-9_]+$/.test(val)) return 'Only lowercase letters, numbers, and underscores'
    return null
  }

  function handleUsernameChange(val: string) {
    const lower = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(lower)
    setUsernameError(validateUsername(lower))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    setError(null)

    const uError = validateUsername(username)
    if (uError) { setUsernameError(uError); setLoading(false); return }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    // Check username uniqueness if it changed
    if (username && username !== profile.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .maybeSingle()
      if (existing) {
        setUsernameError('That username is already taken')
        setLoading(false)
        return
      }
    }

    const { error: saveError } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        username: username.trim() || null,
        school: school.trim() || null,
        exam_date: examDate || null,
        weekly_hours_goal: weeklyHours,
      })
      .eq('id', user.id)

    if (saveError) {
      setError(saveError.message)
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 select-none">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="yourhandle"
                maxLength={24}
                className={`${inputClass} pl-8 ${usernameError ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
            </div>
            {usernameError ? (
              <p className="text-xs text-red-500 mt-1">{usernameError}</p>
            ) : (
              <p className="text-xs text-slate-400 mt-1.5">
                Lowercase letters, numbers, underscores. Required to appear on leaderboards and in search.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              School <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. University of Florida"
              maxLength={80}
              className={inputClass}
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Shows on your public profile and enables school leaderboards.
            </p>
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
        <Button type="submit" disabled={loading || !!usernameError}>
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
