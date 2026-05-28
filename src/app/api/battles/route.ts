import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BattleType } from '@/lib/battles'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: battles, error } = await supabase
    .from('battles')
    .select('*')
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!battles?.length) return NextResponse.json([])

  const userIds = [...new Set(battles.flatMap((b) => [b.challenger_id, b.opponent_id]))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, username, level, current_streak')
    .in('id', userIds)

  const pm = new Map((profiles ?? []).map((p) => [p.id, p]))

  return NextResponse.json(
    battles.map((b) => ({
      ...b,
      challenger: pm.get(b.challenger_id),
      opponent:   pm.get(b.opponent_id),
    }))
  )
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    opponent_id: string
    battle_type: BattleType
    subject?: string | null
    duration_hours: number
  }

  const { opponent_id, battle_type, subject, duration_hours } = body
  if (!opponent_id || !battle_type || !duration_hours) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Must be friends
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('status', 'accepted')
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${opponent_id}),` +
      `and(requester_id.eq.${opponent_id},addressee_id.eq.${user.id})`
    )
    .maybeSingle()

  if (!friendship) {
    return NextResponse.json({ error: 'You can only battle friends' }, { status: 403 })
  }

  // No existing open battle between these two
  const { data: existing } = await supabase
    .from('battles')
    .select('id')
    .or(
      `and(challenger_id.eq.${user.id},opponent_id.eq.${opponent_id}),` +
      `and(challenger_id.eq.${opponent_id},opponent_id.eq.${user.id})`
    )
    .in('status', ['pending', 'active'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'You already have an open battle with this player' },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('battles')
    .insert({
      challenger_id: user.id,
      opponent_id,
      battle_type,
      subject: subject ?? null,
      duration_hours,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
