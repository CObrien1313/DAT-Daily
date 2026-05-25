import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/dashboard/settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, exam_date, weekly_hours_goal')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your profile, exam date, and study goals.
        </p>
      </div>
      <SettingsForm
        profile={{
          name: profile?.name ?? '',
          exam_date: profile?.exam_date ?? null,
          weekly_hours_goal: profile?.weekly_hours_goal ?? 30,
        }}
      />
    </div>
  )
}
