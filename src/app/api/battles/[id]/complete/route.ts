import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BATTLE_XP } from '@/lib/battles'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: battle } = await supabase
    .from('battles')
    .select('*')
    .eq('id', id)
    .single()

  if (!battle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (battle.challenger_id !== user.id && battle.opponent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Already done — idempotent
  if (battle.status === 'completed') {
    return NextResponse.json({ already_completed: true, winner_id: battle.winner_id })
  }

  if (battle.status !== 'active') {
    return NextResponse.json({ error: 'Battle is not active' }, { status: 409 })
  }
  if (!battle.ends_at || new Date(battle.ends_at) > new Date()) {
    return NextResponse.json({ error: 'Battle has not ended yet' }, { status: 409 })
  }

  // Get final scores
  const { data: scores } = await supabase
    .rpc('calculate_battle_scores', { p_battle_id: id })

  if (!scores || scores.length < 2) {
    return NextResponse.json({ error: 'Could not calculate scores' }, { status: 500 })
  }

  const s = scores as Array<{ user_id: string; score: number }>
  const [a, b] = s

  let winnerId: string | null = null
  let loserId:  string | null = null

  if (a.score > b.score) { winnerId = a.user_id; loserId = b.user_id }
  else if (b.score > a.score) { winnerId = b.user_id; loserId = a.user_id }
  // else: tie

  // Mark completed
  await supabase
    .from('battles')
    .update({ status: 'completed', winner_id: winnerId })
    .eq('id', id)

  // Award XP
  const pid1 = battle.challenger_id
  const pid2 = battle.opponent_id

  const [{ data: p1 }, { data: p2 }] = await Promise.all([
    supabase.from('profiles').select('xp').eq('id', pid1).single(),
    supabase.from('profiles').select('xp').eq('id', pid2).single(),
  ])

  const xp1 = p1?.xp ?? 0
  const xp2 = p2?.xp ?? 0

  if (winnerId && loserId) {
    const ws = a.user_id === winnerId ? a.score : b.score
    const ls = a.user_id === loserId  ? a.score : b.score
    const margin = ws > 0 ? Math.abs(ws - ls) / ws : 1
    const loserXP = margin < 0.1 ? BATTLE_XP.CLOSE_LOSS : BATTLE_XP.LOSE

    await Promise.all([
      supabase.from('profiles').update({ xp: (pid1 === winnerId ? xp1 : xp2) + BATTLE_XP.WIN }).eq('id', winnerId),
      supabase.from('profiles').update({ xp: (pid1 === loserId  ? xp1 : xp2) + loserXP }).eq('id', loserId),
    ])
  } else {
    // Tie
    await Promise.all([
      supabase.from('profiles').update({ xp: xp1 + BATTLE_XP.TIE }).eq('id', pid1),
      supabase.from('profiles').update({ xp: xp2 + BATTLE_XP.TIE }).eq('id', pid2),
    ])
  }

  return NextResponse.json({ completed: true, winner_id: winnerId, scores })
}
