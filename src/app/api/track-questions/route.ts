import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — record question answers from recovery or battle sources
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { source, answers } = await req.json() as {
    source: 'recovery' | 'battle'
    answers: { is_correct: boolean }[]
  }

  if (!source || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const rows = answers.map(({ is_correct }) => ({
    user_id:     user.id,
    source,
    is_correct,
    answered_at: now,
  }))

  await supabase.from('question_answers').insert(rows)

  return NextResponse.json({ ok: true })
}
