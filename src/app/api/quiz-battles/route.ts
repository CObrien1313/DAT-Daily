import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { needsDayReset, FREE_LIMITS, PRO_LIMITS } from '@/lib/subscription'

const DAT_SUBJECTS = [
  'Biology',
  'General Chemistry',
  'Organic Chemistry',
  'PAT',
  'Reading Comprehension',
  'Quantitative Reasoning',
]

interface RawQuestion {
  subject: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
}

function extractJSON<T>(text: string): T | null {
  for (const s of [
    text.trim(),
    text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim(),
  ]) {
    try { return JSON.parse(s) as T } catch { /* continue */ }
  }
  // Find first [...] array
  const match = text.match(/\[[\s\S]*\]/)
  if (match) {
    try { return JSON.parse(match[0]) as T } catch { /* continue */ }
  }
  return null
}

// ── GET — list the caller's quiz battles ─────────────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: battles } = await supabase
    .from('quiz_battles')
    .select('id, challenger_id, opponent_id, subject, question_count, status, challenger_score, opponent_score, challenger_time_ms, opponent_time_ms, winner_id, is_tie, accepted_at, expires_at, created_at, challenger_answers, opponent_answers')
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (!battles?.length) return NextResponse.json([])

  const ids = [...new Set(battles.flatMap((b) => [b.challenger_id, b.opponent_id]))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, username, level')
    .in('id', ids)

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  const result = battles.map((b) => ({
    ...b,
    challenger: profileMap[b.challenger_id] ?? null,
    opponent:   profileMap[b.opponent_id]   ?? null,
  }))

  return NextResponse.json(result)
}

// ── POST — create a new quiz battle ──────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { opponent_id, subject, question_count } = await request.json() as {
    opponent_id:    string
    subject:        string | null
    question_count: number
  }

  if (!opponent_id) {
    return NextResponse.json({ error: 'opponent_id is required' }, { status: 400 })
  }

  // ── Check user's plan + daily battle limit ─────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, battles_today, battle_day_start')
    .eq('id', user.id)
    .single()

  const isPro      = (profile?.plan ?? 'free') === 'pro'
  const dayReset   = needsDayReset(profile?.battle_day_start)
  const battlesUsed = dayReset ? 0 : (profile?.battles_today ?? 0)

  if (!isPro && battlesUsed >= FREE_LIMITS.battles_per_day) {
    return NextResponse.json({
      error:   'limit_reached',
      message: 'Upgrade to Pro for unlimited battles.',
    }, { status: 403 })
  }

  // ── Validate question count against plan ───────────────────────────────────
  const maxQ = isPro ? PRO_LIMITS.quiz_questions : FREE_LIMITS.quiz_questions
  const qCount = Math.min(Math.max(question_count ?? FREE_LIMITS.quiz_questions, 1), maxQ)

  if (!isPro && qCount > FREE_LIMITS.quiz_questions) {
    return NextResponse.json({
      error:   'limit_reached',
      message: 'Upgrade to Pro to create battles with up to 30 questions.',
    }, { status: 403 })
  }

  // ── Verify they're friends ─────────────────────────────────────────────────
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
    return NextResponse.json({ error: 'You can only challenge friends.' }, { status: 400 })
  }

  // ── Generate questions via Claude ──────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const subjects = subject ? [subject] : DAT_SUBJECTS
  const subjectLine = subject
    ? `All questions must be about: ${subject}`
    : `Distribute questions evenly across: ${DAT_SUBJECTS.join(', ')}`

  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: 'You are a DAT exam expert. Output ONLY a raw JSON array — no markdown, no explanation.',
    messages: [{
      role: 'user',
      content: `Generate exactly ${qCount} challenging DAT practice questions for a Quiz Duel battle.
${subjectLine}

CRITICAL RULES:
1. Solve each problem yourself first to get the EXACT correct answer.
2. correct_option must be exactly "a", "b", "c", or "d" — whichever option holds the correct answer.
3. IMPORTANT: Spread correct_option values evenly. Do NOT default to "a". Across the full set, roughly 25% should be "a", 25% "b", 25% "c", 25% "d". Vary them deliberately.
4. The other 3 options must be plausible distractors corresponding to specific student mistakes.
5. Do NOT include explanations — this is for a live quiz battle.

Return ONLY this JSON array (no extra text):
[
  {
    "subject": "Biology",
    "question": "Full question text",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_option": "b"
  },
  {
    "subject": "General Chemistry",
    "question": "Full question text",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_option": "d"
  }
]

Generate exactly ${qCount} questions now.`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const parsed = extractJSON<RawQuestion[]>(raw)

  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    return NextResponse.json({ error: 'Could not generate questions — please try again.' }, { status: 500 })
  }

  // Shuffle options for each question to guarantee answer variety
  const shuffled = parsed.map((q) => {
    const opts: Array<{ key: 'a' | 'b' | 'c' | 'd'; text: string }> = [
      { key: 'a', text: q.option_a },
      { key: 'b', text: q.option_b },
      { key: 'c', text: q.option_c },
      { key: 'd', text: q.option_d },
    ]
    // Fisher-Yates shuffle
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[opts[i], opts[j]] = [opts[j], opts[i]]
    }
    const correctText = q[`option_${q.correct_option}` as keyof RawQuestion] as string
    const newCorrect  = opts.find((o) => o.text === correctText)?.key ?? q.correct_option
    return {
      ...q,
      option_a: opts[0].text,
      option_b: opts[1].text,
      option_c: opts[2].text,
      option_d: opts[3].text,
      correct_option: newCorrect,
    }
  })

  // Separate questions (no correct_option) from answers
  const questions = shuffled.map(({ correct_option: _skip, ...rest }) => rest)
  const answers   = shuffled.map((q) => q.correct_option)

  // ── Save battle to DB ──────────────────────────────────────────────────────
  const { data: battle, error: insertErr } = await supabase
    .from('quiz_battles')
    .insert({
      challenger_id:  user.id,
      opponent_id,
      subject:        subject ?? null,
      question_count: qCount,
      status:         'pending',
      questions,
      answers,
    })
    .select('id')
    .single()

  if (insertErr || !battle) {
    return NextResponse.json({ error: 'Failed to create battle.' }, { status: 500 })
  }

  // Increment daily battle counter
  await supabase.from('profiles').update({
    battles_today:   dayReset ? 1 : battlesUsed + 1,
    battle_day_start: dayReset ? new Date().toISOString() : profile?.battle_day_start,
  }).eq('id', user.id)

  return NextResponse.json({ id: battle.id })
}
