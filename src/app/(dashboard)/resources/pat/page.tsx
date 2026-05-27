import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface TipSection {
  id: string
  name: string
  emoji: string
  questions: number
  time: string
  overview: string
  strategy: string[]
  avoid: string[]
}

const PAT_SECTIONS: TipSection[] = [
  {
    id: 'keyholes',
    name: 'Keyholes',
    emoji: '🔑',
    questions: 15,
    time: '~25 sec each',
    overview: 'You are shown a 3D object and must identify which 2D aperture (keyhole) it can pass through without rotating — only sliding straight forward.',
    strategy: [
      'Look at the object from the front and mentally trace its outermost silhouette.',
      'The correct keyhole must be at least as large as the object\'s silhouette in every dimension — it cannot be smaller anywhere.',
      'Eliminate answers where the keyhole is clearly too narrow or the wrong shape.',
      'Check both width AND height — a keyhole may match one dimension but fail the other.',
      'The object cannot be rotated — only translated (pushed) straight through the hole.',
      'Look for unique features: notches, bumps, or angles that should be reflected in the keyhole.',
    ],
    avoid: [
      'Forgetting the no-rotation rule and choosing a keyhole that would work only if tilted.',
      'Matching height but ignoring width (or vice versa).',
      'Overthinking symmetrical shapes — trust your first silhouette read.',
    ],
  },
  {
    id: 'top-front-end',
    name: 'Top-Front-End',
    emoji: '📦',
    questions: 15,
    time: '~25 sec each',
    overview: 'Two of the three views (top, front, end/side) of a 3D object are given. You must identify the missing third view.',
    strategy: [
      'Always identify which two views are given and which one is missing before looking at the answers.',
      'The top view shows length (left-right) and depth (front-back); no height info.',
      'The front view shows length (left-right) and height (up-down); no depth info.',
      'The end view shows depth (front-back) and height (up-down); no length info.',
      'Use dotted lines for hidden edges and solid lines for visible edges when mentally drawing the third view.',
      'Cross-reference: the width of the top view must match the width of the front view. Use this to eliminate wrong answers.',
      'Practice sketching simple objects from all three views before test day.',
    ],
    avoid: [
      'Confusing which view shows which dimensions.',
      'Ignoring hidden lines (dotted) — they indicate edges behind the visible surface.',
      'Not using the shared dimensions between views to verify your answer.',
    ],
  },
  {
    id: 'angle-ranking',
    name: 'Angle Ranking',
    emoji: '📏',
    questions: 15,
    time: '~10 sec each',
    overview: 'Four angles are shown. You must rank them from smallest to largest (or as specified). Line lengths are irrelevant — only the opening between the lines matters.',
    strategy: [
      'Ignore the lengths of the lines entirely — they are designed to mislead you.',
      'Focus only on the opening (the gap) between the two lines of each angle.',
      'Compare angles relative to familiar benchmarks: 45°, 90°, 135°, 180°.',
      'Ask: "Is this more or less than a right angle?" then refine further.',
      'For close angles, use process of elimination rather than precise measurement.',
      'If two look identical, choose the answer that matches your best guess and move on — don\'t spend more than 15 seconds on any angle.',
    ],
    avoid: [
      'Letting longer line lengths trick you into thinking the angle is larger.',
      'Spending too long comparing nearly identical angles — guess and move on.',
      'Forgetting to check the direction of ranking (smallest to largest vs. largest to smallest).',
    ],
  },
  {
    id: 'hole-punching',
    name: 'Hole Punching',
    emoji: '📄',
    questions: 15,
    time: '~20 sec each',
    overview: 'A square piece of paper is folded one or more times, then a hole is punched through all layers. You must identify where the holes appear when the paper is fully unfolded.',
    strategy: [
      'Track the fold lines carefully — each fold creates a reflection axis.',
      'A hole punched through N layers of paper creates N holes when unfolded.',
      'Work backwards: unfold mentally in reverse order, reflecting each hole across the fold line.',
      'For horizontal folds: reflect holes vertically (up-down). For vertical folds: reflect holes horizontally (left-right).',
      'Diagonal folds: reflect across the diagonal — swap x and y coordinates.',
      'Count holes before looking at answers: if 2 folds, expect 4 holes (2² = 4).',
      'Draw a quick grid on scratch paper if allowed, and mark the hole position at each step.',
    ],
    avoid: [
      'Not tracking fold directions carefully — a fold to the right means the right half goes under the left.',
      'Forgetting that each fold doubles the number of holes.',
      'Assuming the hole is always symmetric — check the exact position.',
    ],
  },
  {
    id: 'cube-counting',
    name: 'Cube Counting',
    emoji: '🧊',
    questions: 15,
    time: '~20 sec each',
    overview: 'A 3D structure made of stacked unit cubes is shown. You must count how many cubes have exactly a specified number of painted (exposed) faces.',
    strategy: [
      'Remember: only exposed faces that touch air are painted — faces touching another cube or the floor are not painted.',
      'Each cube starts with 6 faces. Subtract 1 for each face touching another cube or the ground.',
      'A cube sitting flat on the ground loses 1 bottom face. Add cubes sitting next to it: lose 1 for each neighbor.',
      'Go through the structure systematically: bottom layer first, then upper layers.',
      'Cubes in corners have more painted faces; cubes in the interior have fewer.',
      'The question will ask for specific numbers (e.g., "how many cubes have exactly 2 painted faces?") — count carefully.',
      'Use tally marks on scratch paper: one mark per cube, labeled by painted-face count.',
    ],
    avoid: [
      'Forgetting the bottom face (lost to the ground) for all cubes on the lowest level.',
      'Missing hidden cubes — count interior cubes that are implied by the structure.',
      'Counting the same cube twice.',
    ],
  },
  {
    id: 'pattern-folding',
    name: 'Pattern Folding',
    emoji: '📐',
    questions: 15,
    time: '~25 sec each',
    overview: 'A flat 2D net (unfolded pattern) is shown. You must identify which 3D shape it would form when folded.',
    strategy: [
      'Count the faces first: a cube net has 6 squares; a pyramid net has 4 triangles + 1 square base.',
      'Identify the base face (usually the largest or central piece). Build up from there.',
      'Mentally fold faces one at a time, starting with adjacent faces of the base.',
      'Use shading, patterns, or markings on faces to track orientation — a shaded face cannot appear on an opposite side of a cube.',
      'On cubes: opposite faces are those separated by two other faces in the net. Common cube nets memorized save time.',
      'Eliminate answers by checking clearly impossible positions (a face labeled with a dot cannot be opposite a face with a stripe if they\'re adjacent in the net).',
      'If stuck, use process of elimination — even 2-choice is 50/50.',
    ],
    avoid: [
      'Rushing and not tracking which face is which after folding.',
      'Forgetting that once you fold a face up, its orientation relative to others changes.',
      'Spending more than 30 seconds — guess and move on if stumped.',
    ],
  },
]

export default async function PATPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/resources"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Resources
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-5 h-5 text-orange-500" />
          <h1 className="text-2xl font-bold text-slate-900">PAT Strategy Guide</h1>
        </div>
        <p className="text-sm text-slate-500">
          The Perceptual Ability Test has 6 question types, 90 questions total, 60 minutes. That&apos;s 40 seconds per question. Strategy matters as much as spatial ability.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-3 mb-8 p-4 bg-orange-50 border border-orange-100 rounded-xl">
        {[
          { label: 'Total questions', value: '90' },
          { label: 'Time limit', value: '60 min' },
          { label: 'Per question', value: '~40 sec' },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-xl font-bold text-orange-700">{value}</p>
            <p className="text-xs text-orange-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Section breakdown */}
      <div className="space-y-6">
        {PAT_SECTIONS.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200">
              <span className="text-2xl">{section.emoji}</span>
              <div className="flex-1">
                <h2 className="text-base font-bold text-slate-900">{section.name}</h2>
                <p className="text-xs text-slate-400">{section.questions} questions · {section.time}</p>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Overview */}
              <p className="text-sm text-slate-700 leading-relaxed">{section.overview}</p>

              {/* Strategy */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Strategy</p>
                <ul className="space-y-1.5">
                  {section.strategy.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="text-indigo-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                      <span className="leading-snug">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common mistakes */}
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">Common Mistakes to Avoid</p>
                <ul className="space-y-1.5">
                  {section.avoid.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                      <span className="flex-shrink-0 text-red-400 mt-0.5">✗</span>
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer tip */}
      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <p className="text-sm text-indigo-900 font-semibold mb-1">General PAT Tips</p>
        <ul className="space-y-1.5 text-sm text-indigo-800">
          <li>→ Don&apos;t spend more than 40 seconds on any question — guess and mark for review.</li>
          <li>→ Practice daily with DAT-specific PAT generators (Bootcamp, Crack the DAT) — exposure is the best training.</li>
          <li>→ Some question types (angle ranking) are very fast; bank those saved seconds for harder types.</li>
          <li>→ Your score improves dramatically with practice — spatial ability is trainable.</li>
        </ul>
      </div>
    </div>
  )
}
