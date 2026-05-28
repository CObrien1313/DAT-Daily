import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Props { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await request.json() as { action: 'accept' | 'decline' }

  const { data: battle } = await supabase
    .from('quiz_battles')
    .select('id, opponent_id, status')
    .eq('id', id)
    .single()

  if (!battle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (battle.opponent_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (battle.status !== 'pending') return NextResponse.json({ error: 'Battle is not pending' }, { status: 400 })

  if (action === 'decline') {
    await supabase.from('quiz_battles').update({ status: 'declined' }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  // Accept — set active, starts now, expires in 24 hours
  const now       = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  await supabase.from('quiz_battles').update({
    status:      'active',
    accepted_at: now.toISOString(),
    expires_at:  expiresAt.toISOString(),
  }).eq('id', id)

  return NextResponse.json({ ok: true })
}
