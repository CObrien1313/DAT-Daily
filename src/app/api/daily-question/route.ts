import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getQuestionDate } from '@/lib/question-date'

export const maxDuration = 30

const DAT_SUBJECTS = [
  'Biology',
  'General Chemistry',
  'Organic Chemistry',
  'Quantitative Reasoning',
  'Perceptual Ability',
  'Reading Comprehension',
]

interface GeneratedQuestion {
  subject: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation: string
}

function extractJSON<T>(text: string): T | null {
  for (const s of [
    text.trim(),
    text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim(),
  ]) {
    try { return JSON.parse(s) as T } catch { /* continue */ }
  }
  let start = -1, depth = 0, inString = false, escape = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (escape) { escape = false; continue }
    if (c === '\\' && inString) { escape = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue
    if (c === '{') { if (depth === 0) start = i; depth++ }
    else if (c === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        try { return JSON.parse(text.slice(start, i + 1)) as T } catch { start = -1 }
      }
    }
  }
  return null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const questionDate = getQuestionDate()
  const force = new URL(request.url).searchParams.get('force') === 'true'

  // If force-regenerating, delete the cached question first
  if (force) {
    await supabase.from('daily_questions').delete().eq('question_date', questionDate)
  }

  // Return existing question if already generated for today
  if (!force) {
    const { data: existing } = await supabase
      .from('daily_questions')
      .select('*')
      .eq('question_date', questionDate)
      .single()

    if (existing) return NextResponse.json(existing)
  }

  // Generate a new question with Claude
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  // Pick subject deterministically from the date so all users get the same subject
  const dateNum = parseInt(questionDate.replace(/-/g, ''), 10)
  const subject = DAT_SUBJECTS[dateNum % DAT_SUBJECTS.length]

  const subjectInstructions: Record<string, string> = {
    'Perceptual Ability': 'Create a text-based spatial reasoning question (e.g. cube counting, angle comparison, paper folding described in words).',
    'Reading Comprehension': 'Provide a 3–4 sentence scientific passage, then ask one inference or detail question about it.',
  }
  const extra = subjectInstructions[subject] ?? ''

  const client = new Anthropic()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: 'You are a DAT exam expert. Output ONLY raw JSON — no markdown fences, no explanation.',
    messages: [{
      role: 'user',
      content: `Generate one challenging DAT practice question on the topic: ${subject}.
${extra}

CRITICAL RULES — follow these in order:
1. Silently work out the full solution BEFORE writing any JSON. Do all arithmetic completely.
2. Decide which of the four positions (a, b, c, or d) will hold the correct answer — vary this each time, do NOT default to "a".
3. Write the correct answer into that position. Fill the other three with plausible distractors based on named student mistakes (wrong formula, unit error, sign error, etc.).
4. correct_option must match the position containing the exact correct answer. Double-check this before outputting.
5. explanation: reference option letters as they appear in your JSON (e.g. "Option B is correct because..."). 2–3 sentences max.
6. Do NOT second-guess or revise mid-output. Commit to your answer.

Return ONLY this JSON (no extra text, no markdown):
{
  "subject": "${subject}",
  "question": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_option": "c",
  "explanation": "..."
}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const parsed = extractJSON<GeneratedQuestion>(raw)

  if (!parsed) {
    return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
  }

  // NOTE: we do NOT shuffle daily question options because the explanation
  // references option letters by name (e.g. "Option B is wrong because...").
  // Variety is handled purely through the prompt.

  // Upsert so concurrent requests don't conflict
  const { data: saved, error: saveErr } = await supabase
    .from('daily_questions')
    .upsert({
      question_date:  questionDate,
      subject:        parsed.subject,
      question:       parsed.question,
      option_a:       parsed.option_a,
      option_b:       parsed.option_b,
      option_c:       parsed.option_c,
      option_d:       parsed.option_d,
      correct_option: parsed.correct_option,
      explanation:    parsed.explanation,
    }, { onConflict: 'question_date' })
    .select()
    .single()

  if (saveErr || !saved) {
    // Another request beat us to it — fetch whatever is there
    const { data: fallback } = await supabase
      .from('daily_questions')
      .select('*')
      .eq('question_date', questionDate)
      .single()
    if (fallback) return NextResponse.json(fallback)
    return NextResponse.json({ error: 'Failed to save question' }, { status: 500 })
  }

  return NextResponse.json(saved)
}
