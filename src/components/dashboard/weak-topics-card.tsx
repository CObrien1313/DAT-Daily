'use client'

import { useState } from 'react'
import { AlertTriangle, Plus, X, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { DAT_SUBJECTS } from '@/lib/types'
import type { WeakTopic, DATSubject } from '@/lib/types'

interface WeakTopicsCardProps {
  initialTopics: WeakTopic[]
}

type Priority = 'high' | 'medium' | 'low'

const PRIORITY_VARIANT: Record<Priority, 'danger' | 'warning' | 'default'> = {
  high: 'danger',
  medium: 'warning',
  low: 'default',
}

const inputClass =
  'px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white'

export function WeakTopicsCard({ initialTopics }: WeakTopicsCardProps) {
  const [topics, setTopics] = useState(initialTopics)
  const [showForm, setShowForm] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  const [newSubject, setNewSubject] = useState<DATSubject>('Biology')
  const [newPriority, setNewPriority] = useState<Priority>('medium')
  const [adding, setAdding] = useState(false)

  const sorted = [...topics].sort((a, b) => {
    const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })

  async function addTopic(e: React.FormEvent) {
    e.preventDefault()
    if (!newTopic.trim()) return
    setAdding(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAdding(false); return }

    const { data, error } = await supabase
      .from('weak_topics')
      .insert({
        user_id: user.id,
        topic: newTopic.trim(),
        subject: newSubject,
        priority: newPriority,
        resolved: false,
      })
      .select()
      .single()

    if (!error && data) {
      setTopics((prev) => [
        { id: data.id, subject: data.subject, topic: data.topic, priority: data.priority },
        ...prev,
      ])
    }

    setNewTopic('')
    setNewSubject('Biology')
    setNewPriority('medium')
    setShowForm(false)
    setAdding(false)
  }

  async function resolve(id: string) {
    // Optimistic remove
    setTopics((prev) => prev.filter((t) => t.id !== id))

    const supabase = createClient()
    await supabase.from('weak_topics').update({ resolved: true }).eq('id', id)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Weak Topics</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Focus here to improve your score</p>
          </div>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Add form */}
        {showForm && (
          <form onSubmit={addTopic} className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g. Stereochemistry, Le Chatelier's Principle"
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
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className={cn(inputClass, 'w-32')}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={adding}>
                {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {adding ? 'Adding…' : 'Add topic'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowForm(false); setNewTopic('') }}
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Topic list */}
        {sorted.length === 0 && !showForm ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            No weak topics tracked yet. Add topics you struggle with!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sorted.map((topic) => (
              <div
                key={topic.id}
                className="group flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{topic.topic}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{topic.subject}</p>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <Badge variant={PRIORITY_VARIANT[topic.priority]}>{topic.priority}</Badge>
                  <button
                    onClick={() => resolve(topic.id)}
                    title="Mark resolved"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-emerald-500"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showForm && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Track New Weak Topic
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
