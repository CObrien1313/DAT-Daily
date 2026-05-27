import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FLASHCARD_DECKS } from '@/lib/flashcard-data'
import { FlashcardDeckComponent } from '@/components/resources/flashcard-deck'

interface Props {
  params: Promise<{ deck: string }>
}

export default async function FlashcardDeckPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { deck: deckId } = await params
  const deck = FLASHCARD_DECKS.find((d) => d.id === deckId)
  if (!deck) notFound()

  return (
    <div className="min-h-screen bg-slate-50 py-4 md:py-8">
      <FlashcardDeckComponent deck={deck} />
    </div>
  )
}
