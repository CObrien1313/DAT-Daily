import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

// Edge runtime: no 10-second serverless limit — supports up to 30s on Hobby plan
export const runtime = 'edge'

interface PracticeQuestion {
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation: string
}

interface StudySession {
  title: string
  duration_minutes: number
  description: string
}

interface GeneratedPlan {
  overview: string
  key_points: string[]
  practice_questions: PracticeQuestion[]
  study_sessions: StudySession[]
  tips: string[]
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { topicId: string; topic: string; subject: string }
    const { topicId, topic, subject } = body

    if (!topic || !subject) {
      return NextResponse.json({ error: 'Missing topic or subject' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured — check ANTHROPIC_API_KEY in Vercel env vars' }, { status: 503 })
    }

    const client = new Anthropic()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'You are a DAT exam expert and study coach. Output ONLY raw JSON — no markdown fences, no explanation.',
      messages: [{
        role: 'user',
        content: `A student is struggling with "${topic}" in ${subject} for the DAT exam. Generate a focused recovery plan.

PRACTICE QUESTION RULES (CRITICAL):
1. Solve each problem yourself first to get the EXACT correct answer
2. That exact answer MUST appear as one of the 4 options — never approximate
3. The other 3 options must each correspond to a specific named student mistake
4. correct_option must be exactly "a", "b", "c", or "d" matching the option with the exact correct answer

Return ONLY this JSON:
{
  "overview": "2–3 sentences: what this concept is and why DAT students commonly struggle with it",
  "key_points": ["high-yield fact or rule — 5 total"],
  "practice_questions": [
    {
      "question": "Full DAT-level question text",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_option": "a",
      "explanation": "Step-by-step solution, plus why each wrong answer is wrong"
    }
  ],
  "study_sessions": [
    {
      "title": "Verb + what to do (e.g. Review Henderson-Hasselbalch derivation)",
      "duration_minutes": 30,
      "description": "Exactly what to cover or practice in this session"
    }
  ],
  "tips": ["DAT-specific tip — 3–4 total"]
}

Requirements: exactly 3 practice questions, exactly 5 key points, 2–3 study sessions, 3–4 tips.`,
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed: GeneratedPlan | null = null
    for (const candidate of [
      raw.trim(),
      raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim(),
      (raw.match(/\{[\s\S]*\}/) ?? [])[0] ?? '',
    ]) {
      if (!candidate) continue
      try { parsed = JSON.parse(candidate); break } catch { /* try next */ }
    }

    if (!parsed) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
    }

    // Replace existing plan for this topic
    if (topicId) {
      await supabase.from('recovery_plans').delete().eq('user_id', user.id).eq('topic_id', topicId)
    }

    const { data: saved, error: saveErr } = await supabase
      .from('recovery_plans')
      .insert({
        user_id: user.id,
        topic_id: topicId ?? null,
        topic,
        subject,
        overview: parsed.overview,
        key_points: parsed.key_points,
        practice_questions: parsed.practice_questions,
        study_sessions: parsed.study_sessions,
        tips: parsed.tips,
      })
      .select()
      .single()

    if (saveErr || !saved) {
      return NextResponse.json(
        { error: `DB error: ${saveErr?.message ?? 'insert returned no data'}` },
        { status: 500 }
      )
    }

    return NextResponse.json(saved)

  } catch (err) {
    // Top-level catch — always return JSON so the client can display the real message
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
