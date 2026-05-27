import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FLASHCARD_DECKS } from '@/lib/flashcard-data'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const ACCENT: Record<string, string> = {
  'bg-blue-500':    'border-blue-200 bg-blue-50 text-blue-700',
  'bg-violet-500':  'border-violet-200 bg-violet-50 text-violet-700',
  'bg-emerald-500': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'bg-rose-500':    'border-rose-200 bg-rose-50 text-rose-700',
}

export default async function FlashcardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/resources"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Resources
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Flashcard Decks</h1>
        </div>
        <p className="text-sm text-slate-500">
          Flip through cards, mark what you know, and focus on what you don&apos;t. Progress saves to your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FLASHCARD_DECKS.map((deck) => {
          const accentClass = ACCENT[deck.color] ?? 'border-slate-200 bg-slate-50 text-slate-700'
          return (
            <Link key={deck.id} href={`/resources/flashcards/${deck.id}`}>
              <div className="flex flex-col gap-3 p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all h-full">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{deck.emoji}</span>
                  <div>
                    <p className="text-base font-bold text-slate-900">{deck.subject}</p>
                    <p className="text-xs text-slate-400">{deck.cards.length} cards</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{deck.description}</p>
                <div className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg border self-start', accentClass)}>
                  Start Deck →
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <p className="text-sm text-indigo-800">
          <strong>How it works:</strong> Click a card to flip it. Use <strong>Know It</strong> to mark it mastered or <strong>Still Learning</strong> to keep it in rotation. Your progress is saved automatically.
        </p>
      </div>
    </div>
  )
}
