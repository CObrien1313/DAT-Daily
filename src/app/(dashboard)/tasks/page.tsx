import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TaskList } from '@/components/dashboard/task-list'
import { DateNavigator } from '@/components/dashboard/date-navigator'
import type { StudyTask } from '@/lib/types'

interface TasksPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { date: dateParam } = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const date = dateParam ?? today

  const { data: rawTasks } = await supabase
    .from('study_tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('created_at')

  const tasks: StudyTask[] = (rawTasks ?? []).map((t) => ({
    id: t.id,
    userId: t.user_id,
    title: t.title,
    subject: t.subject,
    completed: t.completed,
    date: t.date,
    estimatedMinutes: t.estimated_minutes,
  }))

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your daily study tasks.</p>
      </div>

      <div className="flex justify-center mb-6">
        <DateNavigator date={date} />
      </div>

      <TaskList initialTasks={tasks} date={date} />
    </div>
  )
}
