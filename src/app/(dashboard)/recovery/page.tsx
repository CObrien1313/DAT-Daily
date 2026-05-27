import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Zap, Plus, Lightbulb } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RecoveryTopicCard } from '@/components/dashboard/recovery-topic-card'
import type { WeakTopic } from '@/lib/types'
import type { RecoveryPlan } from '@/components/dashboard/recovery-topic-card'

export const dynamic = 'force-dynamic'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export default async function RecoveryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rawTopics }, { data: rawPlans }] = await Promise.all([
    supabase
      .from('weak_topics')
      .select('*')
      .eq('user_id', user.id)
      .eq('resolved', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('recovery_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const topics: WeakTopic[] = (rawTopics ?? []).map((t) => ({
    id: t.id,
    subject: t.subject,
    topic: t.topic,
    priority: t.priority,
  }))

  // Most-recent plan per topic (plans are already desc by created_at)
  const planByTopicId: Record<string, RecoveryPlan> = {}
  for (const p of rawPlans ?? []) {
    if (p.topic_id && !planByTopicId[p.topic_id]) {
      planByTopicId[p.topic_id] = p as RecoveryPlan
    }
  }

  const sorted = [...topics].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  )

  const withPlans = sorted.filter((t) => planByTopicId[t.id])
  const withoutPlans = sorted.filter((t) => !planByTopicId[t.id])
  const totalPlans = withPlans.length

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Weak Topic Recovery</h1>
          </div>
          <p className="text-sm text-slate-500">
            AI-generated review plans, targeted practice, and recovery sessions for your trouble areas.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Topic
        </Link>
      </div>

      {/* Empty state */}
      {topics.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
          <Zap className="w-10 h-10 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold mb-1">No weak topics tracked yet</p>
          <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
            Add the topics you struggle with on the dashboard — then come back here for your AI recovery plan.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      )}

      {topics.length > 0 && (
        <div className="space-y-8">

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Topics to review', value: topics.length, color: 'text-slate-900' },
              { label: 'Plans generated', value: totalPlans, color: 'text-indigo-600' },
              { label: 'Ready to generate', value: withoutPlans.length, color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* How it works — only show once until first plan exists */}
          {totalPlans === 0 && (
            <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <Lightbulb className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-800 space-y-1">
                <p className="font-semibold">How recovery plans work</p>
                <p className="text-indigo-700 leading-relaxed">
                  Click <strong>Generate Recovery Plan</strong> on any topic below. Claude will build a personalized plan with a concept overview, key rules to memorize, 3 practice questions, and suggested study sessions — all specific to that topic and the DAT.
                </p>
              </div>
            </div>
          )}

          {/* Without plans — needs attention */}
          {withoutPlans.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Ready to Generate ({withoutPlans.length})
              </p>
              <div className="space-y-3">
                {withoutPlans.map((topic) => (
                  <RecoveryTopicCard
                    key={topic.id}
                    topic={topic}
                    initialPlan={null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* With plans */}
          {withPlans.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Recovery Plans ({withPlans.length})
              </p>
              <div className="space-y-3">
                {withPlans.map((topic) => (
                  <RecoveryTopicCard
                    key={topic.id}
                    topic={topic}
                    initialPlan={planByTopicId[topic.id] ?? null}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
