import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

interface GenerateScheduleBody {
  examDate: string | null
  weeklyHours: number
  weakSubjects: string[]
  subjectProgress: { subject: string; progress: number }[]
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI schedule generation is not configured.' },
      { status: 503 }
    )
  }

  const body: GenerateScheduleBody = await request.json()
  const { examDate, weeklyHours, weakSubjects, subjectProgress } = body

  const daysUntilExam = examDate
    ? Math.max(0, Math.ceil((new Date(examDate + 'T12:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const client = new Anthropic()

  let raw = ''
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You are a DAT study coach. Return ONLY a JSON object — no markdown, no explanation.
DAT subjects: Biology, General Chemistry, Organic Chemistry, PAT, Reading Comprehension, Quantitative Reasoning.
Rules: spread study across 7 days, weight weak subjects more, include PAT every day, no break entries as tasks.
Keep every task description to one short sentence (under 15 words).`,
      messages: [
        {
          role: 'user',
          content: `Create a 7-day DAT study schedule.
${daysUntilExam !== null ? `Days until exam: ${daysUntilExam}` : 'Exam date: unknown (plan for 90 days out)'}
Weekly hours: ${weeklyHours}
Weak subjects: ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'none'}
Progress: ${subjectProgress.map((s) => `${s.subject} ${s.progress}%`).join(', ')}

JSON format:
{"weeklyTip":"string","prioritySubjects":["s1","s2"],"weeklyPlan":[{"day":"Monday","totalMinutes":120,"tasks":[{"subject":"Biology","topic":"Cell Division","durationMinutes":60,"description":"Short one-sentence description."}]}]}`,
        },
      ],
    })
    raw = message.content[0].type === 'text' ? message.content[0].text : ''
  } catch (err) {
    console.error('[generate-schedule] API error:', err)
    return NextResponse.json(
      { error: 'Failed to reach the AI. Please try again.' },
      { status: 502 }
    )
  }

  const candidates = [
    raw.trim(),
    raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim(),
    (raw.match(/\{[\s\S]*\}/) ?? [])[0] ?? '',
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      return NextResponse.json(JSON.parse(candidate))
    } catch {
      // try next candidate
    }
  }

  console.error('[generate-schedule] Could not parse:', raw)
  return NextResponse.json(
    { error: 'Could not parse the AI response. Please try again.' },
    { status: 500 }
  )
}
