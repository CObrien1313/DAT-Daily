import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

interface RecentSession {
  subject: string
  duration_minutes: number
  date: string
  confidence: number | null
  productivity: number | null
}

interface GenerateScheduleBody {
  examDate: string | null
  weeklyHours: number
  weakSubjects: string[]
  subjectProgress: { subject: string; progress: number }[]
  recentSessions: RecentSession[]
  notes?: string
}

function buildSessionSummary(sessions: RecentSession[]): string {
  if (sessions.length === 0) return 'No recent sessions logged yet.'

  // Group by subject
  const bySubject: Record<string, { count: number; totalMin: number; avgConf: number; avgProd: number; lastDate: string }> = {}
  for (const s of sessions) {
    if (!bySubject[s.subject]) {
      bySubject[s.subject] = { count: 0, totalMin: 0, avgConf: 0, avgProd: 0, lastDate: s.date }
    }
    const g = bySubject[s.subject]
    g.count++
    g.totalMin += s.duration_minutes
    if (s.confidence) g.avgConf += s.confidence
    if (s.productivity) g.avgProd += s.productivity
    if (s.date > g.lastDate) g.lastDate = s.date
  }

  const DAT_SUBJECTS = ['Biology', 'General Chemistry', 'Organic Chemistry', 'PAT', 'Reading Comprehension', 'Quantitative Reasoning']
  const studiedSubjects = Object.keys(bySubject)
  const unstudied = DAT_SUBJECTS.filter((s) => !studiedSubjects.includes(s))

  const lines: string[] = []

  for (const [subject, g] of Object.entries(bySubject)) {
    const confSessions = sessions.filter((s) => s.subject === subject && s.confidence)
    const prodSessions = sessions.filter((s) => s.subject === subject && s.productivity)
    const avgConf = confSessions.length > 0 ? (confSessions.reduce((a, s) => a + (s.confidence ?? 0), 0) / confSessions.length).toFixed(1) : null
    const avgProd = prodSessions.length > 0 ? (prodSessions.reduce((a, s) => a + (s.productivity ?? 0), 0) / prodSessions.length).toFixed(1) : null

    const flags: string[] = []
    if (avgConf && Number(avgConf) <= 2.5) flags.push('LOW CONFIDENCE — prioritize')
    if (avgConf && Number(avgConf) >= 4.5) flags.push('high confidence')
    if (avgProd && Number(avgProd) <= 2.5) flags.push('low productivity — try shorter sessions')

    lines.push(
      `- ${subject}: ${g.count} session(s), ${g.totalMin}min total` +
      (avgConf ? `, confidence avg ${avgConf}/5` : '') +
      (avgProd ? `, productivity avg ${avgProd}/5` : '') +
      (flags.length ? ` → ${flags.join(', ')}` : '')
    )
  }

  if (unstudied.length > 0) {
    lines.push(`- NOT studied recently: ${unstudied.join(', ')} → include these`)
  }

  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI schedule generation is not configured.' },
      { status: 503 }
    )
  }

  const body: GenerateScheduleBody = await request.json()
  const { examDate, weeklyHours, weakSubjects, subjectProgress, recentSessions, notes } = body

  const daysUntilExam = examDate
    ? Math.max(0, Math.ceil((new Date(examDate + 'T12:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const examPhase =
    daysUntilExam === null ? 'early prep'
    : daysUntilExam > 90 ? 'early prep — focus on content review and foundations'
    : daysUntilExam > 30 ? 'mid prep — balance content review with timed practice'
    : 'exam crunch — prioritize timed practice sections and weak areas'

  const sessionSummary = buildSessionSummary(recentSessions)

  const client = new Anthropic()

  let raw = ''
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You are a DAT study coach. Return ONLY a JSON object — no markdown, no explanation.
DAT subjects: Biology, General Chemistry, Organic Chemistry, PAT, Reading Comprehension, Quantitative Reasoning.
Rules: spread study across 7 days, heavily weight low-confidence and unstudied subjects, include PAT every day, no break entries as tasks, keep descriptions under 15 words.`,
      messages: [
        {
          role: 'user',
          content: `Create an adaptive 7-day DAT study schedule.

STUDENT PROFILE:
- Exam phase: ${examPhase}${daysUntilExam !== null ? ` (${daysUntilExam} days left)` : ''}
- Weekly hours: ${weeklyHours}
- Subject progress: ${subjectProgress.map((s) => `${s.subject} ${s.progress}%`).join(', ')}
- Flagged weak areas: ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'none'}

RECENT SESSION DATA (last 14 days — use this to adapt the schedule):
${sessionSummary}
${notes ? `\nSTUDENT INSTRUCTIONS: ${notes}` : ''}

Adapt the schedule based on the session data: increase time for low-confidence or skipped subjects, reduce time for high-confidence subjects, shift to practice mode if exam is near.

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
