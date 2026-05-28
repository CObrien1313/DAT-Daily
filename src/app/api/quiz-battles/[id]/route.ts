import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: battle } = await supabase
    .from('quiz_battles')
    .select('*')
    .eq('id', id)
    .single()

  if (!battle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isChallenger = battle.challenger_id === user.id
  const isOpponent   = battle.opponent_id   === user.id
  if (!isChallenger && !isOpponent) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, username, level')
    .in('id', [battle.challenger_id, battle.opponent_id])

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  // Determine what to expose
  const viewerAnswers    = isChallenger ? battle.challenger_answers : battle.opponent_answers
  const viewerHasSubmitted = viewerAnswers !== null

  // Hide correct answers until battle is completed or viewer already submitted
  const revealAnswers = battle.status === 'completed' || viewerHasSubmitted

  return NextResponse.json({
    ...battle,
    // Strip correct answers from questions unless battle is over or viewer submitted
    questions: battle.questions ?? [],
    answers:   revealAnswers ? battle.answers : null,
    challenger: profileMap[battle.challenger_id] ?? null,
    opponent:   profileMap[battle.opponent_id]   ?? null,
  })
}
