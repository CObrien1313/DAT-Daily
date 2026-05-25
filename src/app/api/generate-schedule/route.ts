import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

interface GenerateScheduleBody {
  examDate: string | null
  weeklyHours: number
  weakSubjects: string[]
  subjectProgress: { subject: string; progress: number }[]
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI schedule generation is not configured. Add ANTHROPIC_API_KEY to .env.local.' },
      { status: 503 }
    )
  }

  const body: GenerateScheduleBody = await request.json()
  const { examDate, weeklyHours, weakSubjects, subjectProgress } = body

  const daysUntilExam = examDate
    ? Math.max(0, Math.ceil((new Date(examDate + 'T12:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const client = new Anthropic()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: `You are an expert DAT (Dental Admission Test) study coach. The DAT has 6 sections:
- Biology (30 questions): cell biology, genetics, evolution, anatomy & physiology, ecosystems
- General Chemistry (30 questions): stoichiometry, acid/base, equilibrium, electrochemistry, thermodynamics
- Organic Chemistry (30 questions): reactions, mechanisms, nomenclature, spectroscopy, lab techniques
- Perceptual Ability Test / PAT (90 questions): apertures, view recognition, angle ranking, hole punching, cube counting, pattern folding
- Reading Comprehension (50 questions): three scientific passages with comprehension and reasoning questions
- Quantitative Reasoning (40 questions): algebra, probability, statistics, geometry, trigonometry

Rules for building weekly schedules:
- Spread study across the week; allow rest days if weekly hours are low (< 10h)
- Allocate 30–40% more time to weak subjects and subjects with low progress
- PAT must appear every day — even 15-minute sessions build spatial intuition
- Alternate between content review, active recall, and timed practice problems
- Keep individual study blocks 25–90 minutes; mention breaks in task descriptions, do NOT add break entries as separate tasks
- If exam is within 60 days, include at least one full timed section per week
- Total minutes across all days should equal (weeklyHours × 60) ± 5%
- Respond ONLY with the JSON object — no explanation, no markdown fences`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate a personalized 7-day DAT study schedule for this student:

${daysUntilExam !== null ? `- Days until exam: ${daysUntilExam}` : '- Exam date: not set yet (treat as 90 days out)'}
- Weekly study hours: ${weeklyHours}
- Subjects needing extra focus: ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'none specified'}
- Current subject progress (0–100):
${subjectProgress.map((sp) => `  • ${sp.subject}: ${sp.progress}%`).join('\n')}

Return this exact JSON shape (no markdown, no extra text):
{
  "weeklyTip": "one specific, actionable tip for this student based on their profile",
  "prioritySubjects": ["up to 3 subjects that need the most attention this week"],
  "weeklyPlan": [
    {
      "day": "Monday",
      "totalMinutes": 120,
      "tasks": [
        {
          "subject": "Biology",
          "topic": "Cell Division",
          "durationMinutes": 60,
          "description": "Review mitosis vs meiosis phases; draw diagrams from memory then check"
        }
      ]
    }
  ]
}`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''

  // Try the full text first, then strip fences, then extract the first {...} block
  const candidates = [
    raw.trim(),
    raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim(),
    (raw.match(/\{[\s\S]*\}/) ?? [])[0] ?? '',
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      const schedule = JSON.parse(candidate)
      return NextResponse.json(schedule)
    } catch {
      // try next candidate
    }
  }

  console.error('[generate-schedule] Could not parse response:', raw)
  return NextResponse.json(
    { error: 'Could not parse the AI response. Please try again.' },
    { status: 500 }
  )
}
