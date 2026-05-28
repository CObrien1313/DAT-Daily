'use client'

import { useState } from 'react'
import { MessageSquare, Mail, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'Bug Report',        emoji: '🐛', description: 'Something is broken or not working' },
  { id: 'Feature Request',   emoji: '💡', description: 'Suggest something new' },
  { id: 'General Feedback',  emoji: '💬', description: 'General thoughts or comments' },
  { id: 'Content Issue',     emoji: '📚', description: 'Wrong answer, typo, or bad question' },
]

const SUPPORT_EMAIL = 'obrienconor632@gmail.com'

export default function FeedbackPage() {
  const [category, setCategory] = useState('General Feedback')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, message }),
    })

    if (res.ok) {
      setSubmitted(true)
      setMessage('')
    } else {
      const body = await res.json().catch(() => ({}))
      setError((body as { error?: string }).error ?? 'Something went wrong. Try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Help & Feedback</h1>
        </div>
        <p className="text-sm text-slate-500">
          Found a bug, have an idea, or need help? We'd love to hear from you.
        </p>
      </div>

      {/* Support contact */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Mail className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 mb-0.5">Direct support</p>
          <p className="text-sm text-slate-500 mb-2">
            For urgent issues or account questions, email us directly.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {SUPPORT_EMAIL}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Feedback form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-5">Send Feedback</h2>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-900 mb-1">Thanks for the feedback!</p>
            <p className="text-sm text-slate-500 mb-5">We read every message and really appreciate it.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Send another →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      'flex items-start gap-2.5 p-3 rounded-xl border text-left transition-colors',
                      category === cat.id
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span className="text-lg leading-none mt-0.5">{cat.emoji}</span>
                    <div>
                      <p className={cn('text-sm font-medium leading-tight',
                        category === cat.id ? 'text-indigo-900' : 'text-slate-900'
                      )}>
                        {cat.id}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-tight">{cat.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Describe the issue or share your idea…"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
              />
              <p className="text-xs text-slate-400 mt-1">{message.length} / 1000</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {submitting ? 'Sending…' : 'Send Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
