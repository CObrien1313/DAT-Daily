'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle2, BookOpen, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlashcardDeck } from '@/lib/flashcard-data'

// ── localStorage helpers ──────────────────────────────────────────────────────

function getKnownSet(deckId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(`fc_known_${deckId}`)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch { return new Set() }
}

function saveKnownSet(deckId: string, known: Set<string>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`fc_known_${deckId}`, JSON.stringify([...known]))
}

// ── Main component ────────────────────────────────────────────────────────────

interface FlashcardDeckProps {
  deck: FlashcardDeck
}

export function FlashcardDeckComponent({ deck }: FlashcardDeckProps) {
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mode, setMode] = useState<'all' | 'learning'>('all')
  const [sessionDone, setSessionDone] = useState(false)

  // Load progress from localStorage
  useEffect(() => {
    setKnown(getKnownSet(deck.id))
  }, [deck.id])

  const cards = mode === 'learning'
    ? deck.cards.filter((c) => !known.has(c.id))
    : deck.cards

  const current = cards[idx]
  const knownCount = known.size
  const totalCount = deck.cards.length

  const markKnown = useCallback(() => {
    if (!current) return
    const next = new Set(known)
    next.add(current.id)
    setKnown(next)
    saveKnownSet(deck.id, next)
    setFlipped(false)
    if (idx < cards.length - 1) {
      setIdx((i) => i + 1)
    } else {
      setSessionDone(true)
    }
  }, [current, idx, cards.length, known, deck.id])

  const markLearning = useCallback(() => {
    if (!current) return
    const next = new Set(known)
    next.delete(current.id)
    setKnown(next)
    saveKnownSet(deck.id, next)
    setFlipped(false)
    if (idx < cards.length - 1) {
      setIdx((i) => i + 1)
    } else {
      setSessionDone(true)
    }
  }, [current, idx, cards.length, known, deck.id])

  const next = useCallback(() => {
    setFlipped(false)
    setTimeout(() => {
      if (idx < cards.length - 1) setIdx((i) => i + 1)
      else setSessionDone(true)
    }, 150)
  }, [idx, cards.length])

  const prev = useCallback(() => {
    if (idx > 0) {
      setFlipped(false)
      setTimeout(() => setIdx((i) => i - 1), 150)
    }
  }, [idx])

  function reset() {
    setIdx(0)
    setFlipped(false)
    setSessionDone(false)
  }

  function resetProgress() {
    const empty = new Set<string>()
    setKnown(empty)
    saveKnownSet(deck.id, empty)
    reset()
  }

  // ── Session complete screen ─────────────────────────────────────────────────
  if (sessionDone || cards.length === 0) {
    const allDone = knownCount === totalCount
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">{allDone ? '🏆' : '✅'}</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {allDone ? 'Deck Mastered!' : 'Session Complete!'}
        </h2>
        <p className="text-slate-500 mb-2">
          {knownCount} / {totalCount} cards known
        </p>
        <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.round((knownCount / totalCount) * 100)}%` }}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {knownCount < totalCount && (
            <button
              onClick={() => { setMode('learning'); reset() }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Study remaining ({totalCount - knownCount})
            </button>
          )}
          <button
            onClick={() => { setMode('all'); reset() }}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Review all cards
          </button>
          <Link
            href="/resources/flashcards"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Back to decks
          </Link>
        </div>
        {knownCount > 0 && (
          <button
            onClick={resetProgress}
            className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
          >
            Reset all progress for this deck
          </button>
        )}
      </div>
    )
  }

  const pct = Math.round(((idx + 1) / cards.length) * 100)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">

      {/* Back link + header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/resources/flashcards"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          All Decks
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-lg">{deck.emoji}</span>
          <span className="text-sm font-semibold text-slate-700">{deck.subject}</span>
        </div>
        <button
          onClick={resetProgress}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{idx + 1} / {cards.length} {mode === 'learning' ? '(still learning)' : ''}</span>
          <span>{knownCount} known · {totalCount - knownCount} learning</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Known progress */}
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((knownCount / totalCount) * 100)}%` }}
          />
        </div>
      </div>

      {/* Card with flip */}
      <div
        className="relative cursor-pointer select-none mb-5"
        style={{ perspective: '1200px', height: '340px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 border-slate-200 shadow-lg"
          >
            <div className={cn('w-2 h-10 rounded-full mb-6', deck.color)} />
            <p className="text-xl font-bold text-slate-900 text-center leading-snug">
              {current.front}
            </p>
            <p className="text-xs text-slate-400 mt-6 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Click to reveal answer
            </p>
          </div>

          {/* Back */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-lg overflow-y-auto"
          >
            <p className="text-sm text-slate-100 text-center leading-relaxed whitespace-pre-line">
              {current.back}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {flipped && (
        <div className="flex gap-3 mb-5 animate-in fade-in duration-200">
          <button
            onClick={(e) => { e.stopPropagation(); markLearning() }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            ↩ Still Learning
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); markKnown() }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Know It
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={prev}
          disabled={idx === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Prev
        </button>

        {!flipped && (
          <button
            onClick={() => setFlipped(true)}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Flip
          </button>
        )}

        {flipped && (
          <button
            onClick={next}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Skip →
          </button>
        )}

        <button
          onClick={next}
          disabled={idx === cards.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
