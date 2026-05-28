import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await request.json() as { action: 'accept' | 'decline' }
  if (action !== 'accept' && action !== 'decline') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: battle } = await supabase
    .from('battles')
    .select('*')
    .eq('id', id)
    .single()

  if (!battle) return NextResponse.json({ error: 'Battle not found' }, { status: 404 })
  if (battle.opponent_id !== user.id) {
    return NextResponse.json({ error: 'Only the challenged player can respond' }, { status: 403 })
  }
  if (battle.status !== 'pending') {
    return NextResponse.json({ error: 'Battle is no longer pending' }, { status: 409 })
  }

  if (action === 'accept') {
    const now = new Date()
    const endsAt = new Date(now.getTime() + battle.duration_hours * 3_600_000)
    const { error } = await supabase
      .from('battles')
      .update({
        status: 'active',
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: 'active', ends_at: endsAt.toISOString() })
  } else {
    const { error } = await supabase
      .from('battles')
      .update({ status: 'declined' })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: 'declined' })
  }
}
