import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { questionIndex } = await req.json()
  if (typeof questionIndex !== 'number') {
    return NextResponse.json({ error: 'Invalid questionIndex' }, { status: 400 })
  }

  const { data: battle } = await supabase
    .from('quiz_battles')
    .select('challenger_id, opponent_id, status, answers')
    .eq('id', id)
    .single()

  if (!battle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isParticipant = battle.challenger_id === user.id || battle.opponent_id === user.id
  if (!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (battle.status !== 'active' && battle.status !== 'completed') {
    return NextResponse.json({ error: 'Battle not active' }, { status: 400 })
  }

  const answers: string[] = battle.answers ?? []
  const correctAnswer = answers[questionIndex]
  if (!correctAnswer) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

  return NextResponse.json({ correctAnswer })
}
