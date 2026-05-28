import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  FREE_LIMITS,
  needsWeekReset,
  needsDayReset,
  tomorrowUTC,
  addDays,
  type Plan,
  type UsageSummary,
} from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: p } = await supabase
    .from('profiles')
    .select('plan, schedules_this_week, schedule_week_start, recovery_plans_this_week, recovery_week_start, battles_today, battle_day_start')
    .eq('id', user.id)
    .single()

  const plan: Plan = (p?.plan ?? 'free') as Plan
  const isPro = plan === 'pro'

  const schedReset  = needsWeekReset(p?.schedule_week_start)
  const recReset    = needsWeekReset(p?.recovery_week_start)
  const battleReset = needsDayReset(p?.battle_day_start)

  const schedUsed  = schedReset  ? 0 : (p?.schedules_this_week    ?? 0)
  const recUsed    = recReset    ? 0 : (p?.recovery_plans_this_week ?? 0)
  const battleUsed = battleReset ? 0 : (p?.battles_today           ?? 0)

  const summary: UsageSummary = {
    plan,
    schedules: {
      used:      schedUsed,
      limit:     isPro ? Infinity : FREE_LIMITS.schedules_per_week,
      resets_at: (!isPro && !schedReset && p?.schedule_week_start)
        ? addDays(p.schedule_week_start, 7)
        : null,
    },
    recovery: {
      used:      recUsed,
      limit:     isPro ? Infinity : FREE_LIMITS.recovery_per_week,
      resets_at: (!isPro && !recReset && p?.recovery_week_start)
        ? addDays(p.recovery_week_start, 7)
        : null,
    },
    battles: {
      used:      battleUsed,
      limit:     isPro ? Infinity : FREE_LIMITS.battles_per_day,
      resets_at: (!isPro && !battleReset) ? tomorrowUTC() : null,
    },
  }

  return NextResponse.json(summary)
}
