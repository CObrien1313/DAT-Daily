import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, onboarded')
    .eq('id', user.id)
    .single()

  // Already onboarded — send to dashboard
  if (profile?.onboarded) redirect('/dashboard')

  return <OnboardingWizard initialName={profile?.name ?? ''} />
}
