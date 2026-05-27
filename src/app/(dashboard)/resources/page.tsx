import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Library, FlaskConical, Layers, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const RESOURCES = [
  {
    href: '/resources/formulas',
    icon: FlaskConical,
    emoji: '📋',
    title: 'Formula Sheets',
    description: 'All high-yield formulas for Gen Chem, Orgo, Bio, and QR — organized by topic.',
    tags: ['Gen Chem', 'Orgo', 'Bio', 'QR'],
    color: 'border-blue-200 hover:border-blue-400',
    iconBg: 'bg-blue-50 text-blue-600',
  },
  {
    href: '/resources/flashcards',
    icon: Layers,
    emoji: '🃏',
    title: 'Flashcard Decks',
    description: 'Flip-card study decks with progress tracking. Mark cards as known or still learning.',
    tags: ['80 cards', 'Gen Chem', 'Orgo', 'Bio', 'QR'],
    color: 'border-violet-200 hover:border-violet-400',
    iconBg: 'bg-violet-50 text-violet-600',
  },
  {
    href: '/resources/pat',
    icon: Eye,
    emoji: '🔷',
    title: 'PAT Strategy Guide',
    description: 'Tips and techniques for all 6 PAT question types — keyholes, angle ranking, cube counting, and more.',
    tags: ['Keyholes', 'Top-Front-End', 'Hole Punching', 'Cube Counting'],
    color: 'border-orange-200 hover:border-orange-400',
    iconBg: 'bg-orange-50 text-orange-600',
  },
]

export default async function ResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Library className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">DAT Resources</h1>
        </div>
        <p className="text-sm text-slate-500">
          Formula sheets, flashcards, and strategy guides to supplement your study sessions.
        </p>
      </div>

      <div className="space-y-4">
        {RESOURCES.map((r) => {
          const Icon = r.icon
          return (
            <Link key={r.href} href={r.href}>
              <div className={`flex gap-5 p-5 bg-white rounded-2xl border-2 transition-all hover:shadow-md ${r.color}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${r.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{r.emoji}</span>
                    <h2 className="text-base font-bold text-slate-900">{r.title}</h2>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mb-2">{r.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.tags.map((tag) => (
                      <span key={tag} className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
