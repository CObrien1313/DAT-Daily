'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Clock, Plus, X, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { DAT_SUBJECTS } from '@/lib/types'
import type { StudyTask, DATSubject } from '@/lib/types'

const SUBJECT_BADGE_VARIANT: Record<DATSubject, 'default' | 'success' | 'info' | 'warning'> = {
  Biology: 'success',
  'General Chemistry': 'info',
  'Organic Chemistry': 'default',
  PAT: 'warning',
  'Reading Comprehension': 'info',
  'Quantitative Reasoning': 'default',
}

interface TaskListProps {
  initialTasks: StudyTask[]
  date?: string
}

export function TaskList({ initialTasks, date }: TaskListProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const _now = new Date()
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`
  const taskDate = date ?? today
  const isToday = taskDate === today
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSubject, setNewSubject] = useState<DATSubject>('Biology')
  const [newMinutes, setNewMinutes] = useState(30)
  const [newDate, setNewDate] = useState(taskDate)
  const [adding, setAdding] = useState(false)

  const completed = tasks.filter((t) => t.completed).length

  async function toggle(id: string) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )

    const supabase = createClient()
    await supabase
      .from('study_tasks')
      .update({ completed: !task.completed })
      .eq('id', id)
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAdding(false); return }

    const { data, error } = await supabase
      .from('study_tasks')
      .insert({
        user_id: user.id,
        title: newTitle.trim(),
        subject: newSubject,
        estimated_minutes: newMinutes,
        date: newDate,
        completed: false,
      })
      .select()
      .single()

    if (!error && data) {
      setTasks((prev) => [
        ...prev,
        {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          subject: data.subject,
          completed: data.completed,
          date: data.date,
          estimatedMinutes: data.estimated_minutes,
        },
      ])
    }

    setNewTitle('')
    setNewSubject('Biology')
    setNewMinutes(30)
    setNewDate(taskDate)
    setShowForm(false)
    setAdding(false)
    router.refresh()
  }

  const inputClass =
    'px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{isToday ? "Today's Tasks" : 'Tasks'}</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              {completed}/{tasks.length} completed
            </p>
          </div>
          {!showForm && (
            <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Add task form */}
        {showForm && (
          <form onSubmit={addTask} className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title, e.g. Read Biology Ch. 5"
              required
              autoFocus
              className={cn(inputClass, 'w-full')}
            />
            <div className="flex gap-2">
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value as DATSubject)}
                className={cn(inputClass, 'flex-1')}
              >
                {DAT_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(Number(e.target.value))}
                  min={5}
                  max={300}
                  step={5}
                  className={cn(inputClass, 'w-20')}
                />
                <span className="text-xs text-slate-500">min</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={cn(inputClass, 'flex-1')}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={adding}>
                {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {adding ? 'Adding…' : 'Add task'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowForm(false); setNewTitle('') }}
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Task list */}
        {tasks.length === 0 && !showForm ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No tasks for today.</p>
            <p className="text-xs mt-1">Click &quot;Add Task&quot; to get started.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer select-none',
                  task.completed
                    ? 'bg-slate-50 border-slate-100'
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                )}
                onClick={() => toggle(task.id)}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                  )}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={SUBJECT_BADGE_VARIANT[task.subject] ?? 'default'}>
                      {task.subject}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {task.estimatedMinutes}m
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
