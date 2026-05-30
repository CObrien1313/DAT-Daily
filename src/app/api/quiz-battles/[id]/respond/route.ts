import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { needsDayReset, FREE_LIMITS } from '@/lib/subscription'

interface Props { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await request.json() as { action: 'accept' | 'decline' }

  const { data: battle } = await supabase
    .from('quiz_battles')
    .select('id, opponent_id, status, question_count')
    .eq('id', id)
    .single()

  if (!battle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (battle.opponent_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (battle.status !== 'pending') return NextResponse.json({ error: 'Battle is not pending' }, { status: 400 })

  if (action === 'decline') {
    await supabase.from('quiz_battles').update({ status: 'declined' }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  // ── Check accepter's plan + daily limit before allowing accept ────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, battles_today, battle_day_start')
    .eq('id', user.id)
    .single()

  const isPro       = (profile?.plan ?? 'free') === 'pro'
  const dayReset    = needsDayReset(profile?.battle_day_start)
  const battlesUsed = dayReset ? 0 : (profile?.battles_today ?? 0)

  if (!isPro && battlesUsed >= FREE_LIMITS.battles_per_day) {
    return NextResponse.json({
      error:   'limit_reached',
      message: 'You\'ve used your free battle for today. Upgrade to Pro for unlimited battles.',
    }, { status: 403 })
  }

  if (!isPro && battle.question_count > FREE_LIMITS.quiz_questions) {
    return NextResponse.json({
      error:   'limit_reached',
      message: `This battle has ${battle.question_count} questions. Upgrade to Pro to play battles with more than ${FREE_LIMITS.quiz_questions} questions.`,
    }, { status: 403 })
  }

  // Accept — set active, starts now, expires in 24 hours
  const now       = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  await supabase.from('quiz_battles').update({
    status:      'active',
    accepted_at: now.toISOString(),
    expires_at:  expiresAt.toISOString(),
  }).eq('id', id)

  // Increment accepter's daily battle counter
  await supabase.from('profiles').update({
    battles_today:    dayReset ? 1 : battlesUsed + 1,
    battle_day_start: dayReset ? now.toISOString() : profile?.battle_day_start,
  }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
