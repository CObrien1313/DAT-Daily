import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { needsWeekReset } from '@/lib/subscription'

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

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI schedule generation is not configured.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Auth + usage limit check ───────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, schedules_this_week, schedule_week_start')
    .eq('id', user.id)
    .single()

  const isPro = (profile?.plan ?? 'free') === 'pro'
  const schedReset = needsWeekReset(profile?.schedule_week_start)
  const schedUsed  = schedReset ? 0 : (profile?.schedules_this_week ?? 0)

  if (!isPro && schedUsed >= 1) {
    return new Response(JSON.stringify({
      error:   'limit_reached',
      message: 'Upgrade to Pro for unlimited AI schedule recreations.',
    }), { status: 403, headers: { 'Content-Type': 'application/json' } })
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

  const client = new Anthropic()

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        const anthropicStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: `You are a DAT study coach. Output ONLY raw JSON — no markdown fences, no explanation, no text before or after the JSON object.
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

RECENT SESSION DATA (last 14 days):
${sessionSummary}
${notes ? `\nSTUDENT INSTRUCTIONS: ${notes}` : ''}

Return this JSON shape and nothing else:
{"weeklyTip":"string","prioritySubjects":["s1","s2"],"weeklyPlan":[{"day":"Monday","totalMinutes":120,"tasks":[{"subject":"Biology","topic":"Cell Division","durationMinutes":60,"description":"One sentence under 15 words."}]}]}`,
            },
          ],
        })

        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        // Increment weekly usage counter after successful stream
        if (!isPro) {
          await supabase.from('profiles').update({
            schedules_this_week: schedReset ? 1 : schedUsed + 1,
            schedule_week_start: schedReset ? new Date().toISOString() : profile?.schedule_week_start,
          }).eq('id', user.id)
        }
        controller.close()
      } catch (err) {
        console.error('[generate-schedule] Stream error:', err)
        controller.enqueue(encoder.encode('\n__ERROR__'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
