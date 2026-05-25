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

  const DAT_SUBJECTS = ['Biology', 'General Chemistry', 'Organic Chemistry', 'PAT', 'Reading Comprehension', 'Quantitative Reasoning']
  const bySubject: Record<string, { count: number; totalMin: number; confScores: number[]; prodScores: number[] }> = {}

  for (const s of sessions) {
    if (!bySubject[s.subject]) bySubject[s.subject] = { count: 0, totalMin: 0, confScores: [], prodScores: [] }
    bySubject[s.subject].count++
    bySubject[s.subject].totalMin += s.duration_minutes
    if (s.confidence) bySubject[s.subject].confScores.push(s.confidence)
    if (s.productivity) bySubject[s.subject].prodScores.push(s.productivity)
  }

  const unstudied = DAT_SUBJECTS.filter((s) => !bySubject[s])
  const lines: string[] = []

  for (const [subject, g] of Object.entries(bySubject)) {
    const avgConf = g.confScores.length > 0 ? (g.confScores.reduce((a, b) => a + b, 0) / g.confScores.length).toFixed(1) : null
    const avgProd = g.prodScores.length > 0 ? (g.prodScores.reduce((a, b) => a + b, 0) / g.prodScores.length).toFixed(1) : null
    const flags: string[] = []
    if (avgConf && Number(avgConf) <= 2.5) flags.push('LOW CONFIDENCE — prioritize heavily')
    if (avgConf && Number(avgConf) >= 4.5) flags.push('high confidence — reduce time')
    if (avgProd && Number(avgProd) <= 2.5) flags.push('low productivity — try shorter sessions')
    lines.push(
      `- ${subject}: ${g.count} session(s), ${g.totalMin}min` +
      (avgConf ? `, confidence ${avgConf}/5` : '') +
      (avgProd ? `, productivity ${avgProd}/5` : '') +
      (flags.length ? ` → ${flags.join(', ')}` : '')
    )
  }

  if (unstudied.length > 0) lines.push(`- NOT studied recently: ${unstudied.join(', ')} → must include`)
  return lines.join('\n')
}

function tryParse(text: string): object | null {
  const candidates = [
    text.trim(),
    text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim(),
    (text.match(/\{[\s\S]*\}/) ?? [])[0] ?? '',
  ]
  for (const c of candidates) {
    if (!c) continue
    try { return JSON.parse(c) } catch { /* try next */ }
  }
  return null
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI schedule generation is not configured.' }, { status: 503 })
  }

  const body: GenerateScheduleBody = await request.json()
  const { examDate, weeklyHours, weakSubjects, subjectProgress, recentSessions, notes } = body

  const daysUntilExam = examDate
    ? Math.max(0, Math.ceil((new Date(examDate + 'T12:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const examPhase =
    daysUntilExam === null ? 'early prep'
    : daysUntilExam > 90 ? 'early prep — focus on content review'
    : daysUntilExam > 30 ? 'mid prep — balance review with timed practice'
    : 'exam crunch — prioritize timed practice and weak areas'

  const sessionSummary = buildSessionSummary(recentSessions)

  const systemPrompt = `You are a DAT study coach. Output ONLY raw JSON — no markdown fences, no explanation, no text before or after the JSON object.
DAT subjects: Biology, General Chemistry, Organic Chemistry, PAT, Reading Comprehension, Quantitative Reasoning.
Rules: spread study across 7 days, heavily weight low-confidence and unstudied subjects, include PAT every day, no break entries as tasks, keep descriptions under 15 words.`

  const userPrompt = `Create an adaptive 7-day DAT study schedule.

STUDENT PROFILE:
- Exam phase: ${examPhase}${daysUntilExam !== null ? ` (${daysUntilExam} days left)` : ''}
- Weekly hours: ${weeklyHours}
- Subject progress: ${subjectProgress.map((s) => `${s.subject} ${s.progress}%`).join(', ')}
- Flagged weak areas: ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'none'}

RECENT SESSION DATA (last 14 days):
${sessionSummary}
${notes ? `\nSTUDENT INSTRUCTIONS: ${notes}` : ''}

Return this JSON shape and nothing else:
{"weeklyTip":"string","prioritySubjects":["s1","s2"],"weeklyPlan":[{"day":"Monday","totalMinutes":120,"tasks":[{"subject":"Biology","topic":"Cell Division","durationMinutes":60,"description":"One sentence under 15 words."}]}]}`

  const client = new Anthropic()

  // Try up to 2 times in case of a bad response
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw = ''
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })
      raw = message.content[0].type === 'text' ? message.content[0].text : ''
    } catch (err) {
      console.error(`[generate-schedule] API error attempt ${attempt + 1}:`, err)
      if (attempt === 1) {
        return NextResponse.json({ error: 'Failed to reach the AI. Please try again.' }, { status: 502 })
      }
      continue
    }

    const parsed = tryParse(raw)
    if (parsed) return NextResponse.json(parsed)

    console.error(`[generate-schedule] Parse failed attempt ${attempt + 1}:`, raw.slice(0, 200))
  }

  return NextResponse.json({ error: 'Could not generate a valid schedule. Please try again.' }, { status: 500 })
}
