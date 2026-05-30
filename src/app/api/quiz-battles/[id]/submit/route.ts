import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BATTLE_XP } from '@/lib/battles'

interface Props { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // answers: Record<number, string> e.g. {0:'a',1:'c',...}
  // time_ms: number — elapsed milliseconds from when user started
  const { answers: userAnswers, time_ms } = await request.json() as {
    answers: Record<number, string>
    time_ms: number
  }

  const { data: battle } = await supabase
    .from('quiz_battles')
    .select('*')
    .eq('id', id)
    .single()

  if (!battle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isChallenger = battle.challenger_id === user.id
  const isOpponent   = battle.opponent_id   === user.id
  if (!isChallenger && !isOpponent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (battle.status !== 'active') return NextResponse.json({ error: 'Battle not active' }, { status: 400 })

  // Idempotency: don't overwrite a submission
  const alreadySubmitted = isChallenger ? battle.challenger_answers !== null : battle.opponent_answers !== null
  if (alreadySubmitted) return NextResponse.json({ error: 'Already submitted' }, { status: 400 })

  // Calculate score
  const correctAnswers: string[] = battle.answers ?? []
  let score = 0
  for (let i = 0; i < correctAnswers.length; i++) {
    if (userAnswers[i] === correctAnswers[i]) score++
  }

  // Persist this player's submission
  const updateFields = isChallenger
    ? { challenger_answers: userAnswers, challenger_score: score, challenger_time_ms: time_ms }
    : { opponent_answers:   userAnswers, opponent_score:   score, opponent_time_ms:   time_ms }

  await supabase.from('quiz_battles').update(updateFields).eq('id', id)

  // Track answers for leaderboard (fire-and-forget)
  const now = new Date().toISOString()
  const answerRows = correctAnswers.map((correct, i) => ({
    user_id:     user.id,
    source:      'battle',
    is_correct:  userAnswers[i] === correct,
    answered_at: now,
  }))
  await supabase.from('question_answers').insert(answerRows)

  // Re-fetch to check if both have submitted
  const { data: updated } = await supabase
    .from('quiz_battles')
    .select('*')
    .eq('id', id)
    .single()

  if (!updated) return NextResponse.json({ score, total: correctAnswers.length })

  const cScore   = updated.challenger_score
  const oScore   = updated.opponent_score
  const cTime    = updated.challenger_time_ms
  const oTime    = updated.opponent_time_ms
  const bothDone = updated.challenger_answers !== null && updated.opponent_answers !== null

  if (bothDone && cScore !== null && oScore !== null) {
    // Determine winner
    let winnerId: string | null = null
    let isTie = false

    if (cScore > oScore) {
      winnerId = updated.challenger_id
    } else if (oScore > cScore) {
      winnerId = updated.opponent_id
    } else {
      // Same score — tiebreaker: faster time wins
      if (cTime !== null && oTime !== null) {
        if (cTime < oTime) {
          winnerId = updated.challenger_id
        } else if (oTime < cTime) {
          winnerId = updated.opponent_id
        } else {
          isTie = true
        }
      } else {
        isTie = true
      }
    }

    await supabase.from('quiz_battles').update({
      status:    'completed',
      winner_id: winnerId,
      is_tie:    isTie,
    }).eq('id', id)

    // Award XP
    const loserId = winnerId === updated.challenger_id ? updated.opponent_id : updated.challenger_id
    const margin  = Math.abs((cScore ?? 0) - (oScore ?? 0))
    const total   = correctAnswers.length
    const isClose = total > 0 && margin / total < 0.1

    if (isTie) {
      await Promise.all([
        supabase.rpc('increment_xp', { p_user_id: updated.challenger_id, p_amount: BATTLE_XP.TIE }),
        supabase.rpc('increment_xp', { p_user_id: updated.opponent_id,   p_amount: BATTLE_XP.TIE }),
      ])
    } else if (winnerId) {
      await Promise.all([
        supabase.rpc('increment_xp', { p_user_id: winnerId, p_amount: BATTLE_XP.WIN }),
        supabase.rpc('increment_xp', { p_user_id: loserId,  p_amount: isClose ? BATTLE_XP.CLOSE_LOSS : BATTLE_XP.LOSE }),
      ])
    }
  }

  return NextResponse.json({ score, total: correctAnswers.length })
}
