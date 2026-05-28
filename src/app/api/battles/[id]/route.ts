import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: battle, error } = await supabase
    .from('battles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !battle) return NextResponse.json({ error: 'Battle not found' }, { status: 404 })
  if (battle.challenger_id !== user.id && battle.opponent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, username, level, current_streak')
    .in('id', [battle.challenger_id, battle.opponent_id])

  const pm = new Map((profiles ?? []).map((p) => [p.id, p]))

  let scores = null
  if (battle.status === 'active' || battle.status === 'completed') {
    const { data } = await supabase.rpc('calculate_battle_scores', { p_battle_id: id })
    scores = data ?? []
  }

  return NextResponse.json({
    ...battle,
    challenger: pm.get(battle.challenger_id),
    opponent:   pm.get(battle.opponent_id),
    scores,
  })
}
