import { redirect } from 'next/navigation'
import { Flame, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getQuestionDate, calcQuestionStreak } from '@/lib/question-date'
import { DailyQuestionCard } from '@/components/dashboard/daily-question-card'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function StatTile({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center gap-1.5 text-center">
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', color)}>
        {icon}
      </div>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

export default async function QuestionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const questionDate = getQuestionDate()

  const [
    { data: dailyQuestion },
    { data: userAnswer },
    { data: allAnswers },
  ] = await Promise.all([
    supabase.from('daily_questions').select('*').eq('question_date', questionDate).single(),
    supabase
      .from('daily_question_answers')
      .select('selected_option, is_correct')
      .eq('user_id', user.id)
      .eq('question_date', questionDate)
      .single(),
    supabase
      .from('daily_question_answers')
      .select('question_date, is_correct')
      .eq('user_id', user.id),
  ])

  const answeredDates = (allAnswers ?? []).map((a) => a.question_date)
  const questionStreak = calcQuestionStreak(answeredDates, questionDate)
  const totalCorrect = (allAnswers ?? []).filter((a) => a.is_correct).length
  const totalWrong = (allAnswers ?? []).filter((a) => !a.is_correct).length
  const totalAnswered = totalCorrect + totalWrong
  const pctCorrect = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Daily DAT Question</h1>
        <p className="text-sm text-slate-500 mt-1">
          One question every day at 8 AM ET — across all DAT subjects.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatTile
          icon={<Flame className={cn('w-4 h-4', questionStreak > 0 ? 'text-orange-500' : 'text-slate-400')} />}
          value={questionStreak}
          label="day streak"
          color={questionStreak > 0 ? 'bg-orange-50' : 'bg-slate-100'}
        />
        <StatTile
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          value={totalCorrect}
          label="correct"
          color="bg-emerald-50"
        />
        <StatTile
          icon={<XCircle className="w-4 h-4 text-red-500" />}
          value={totalWrong}
          label="wrong"
          color="bg-red-50"
        />
        <StatTile
          icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
          value={totalAnswered > 0 ? `${pctCorrect}%` : '—'}
          label="accuracy"
          color="bg-indigo-50"
        />
      </div>

      {/* Progress bar (only show once user has answered at least one) */}
      {totalAnswered > 0 && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-700">{totalAnswered} questions answered</span>
            <span>{pctCorrect}% correct</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${pctCorrect}%` }}
            />
          </div>
        </div>
      )}

      {/* Question card */}
      <DailyQuestionCard
        questionDate={questionDate}
        userId={user.id}
        initialQuestion={dailyQuestion ?? null}
        initialAnswer={userAnswer ?? null}
      />
    </div>
  )
}
