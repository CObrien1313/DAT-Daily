import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function RCStrategyPage() {
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
          <BookOpen className="w-5 h-5 text-cyan-600" />
          <h1 className="text-2xl font-bold text-slate-900">RC Strategy Guide</h1>
        </div>
        <p className="text-sm text-slate-500">
          Reading Comprehension is the most coachable section of the DAT. These strategies can turn it from your worst to your best section.
        </p>
      </div>

      {/* Section stats */}
      <div className="grid grid-cols-3 gap-3 mb-8 p-4 bg-cyan-50 border border-cyan-100 rounded-xl">
        {[
          { label: 'Passages', value: '3' },
          { label: 'Questions', value: '50' },
          { label: 'Time limit', value: '60 min' },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-xl font-bold text-cyan-700">{value}</p>
            <p className="text-xs text-cyan-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Section 1: The Big Picture ──────────────────────────────────────── */}
      <Section title="The Big Picture" emoji="🗺️">
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          The DAT RC section gives you 3 scientific passages (roughly 1,500–2,000 words each) and 16–17 questions per passage. You have 60 minutes, which works out to about 20 minutes per passage. Unlike other standardized tests, every answer is supported by something in the text — there are no opinion or inference questions that require outside knowledge.
        </p>
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <p className="text-sm text-indigo-900 font-semibold mb-1">The Core Principle</p>
          <p className="text-sm text-indigo-800">The correct answer is always in the passage. Your job is retrieval, not reasoning.</p>
        </div>
      </Section>

      {/* ── Section 2: The Two Main Approaches ─────────────────────────────── */}
      <Section title="The Two Main Approaches" emoji="🔀">
        <p className="text-sm text-slate-700 mb-4">Students score well with either approach — pick one and commit to it through all your practice.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50">
            <p className="text-sm font-bold text-indigo-900 mb-2">Search & Destroy (Recommended)</p>
            <ol className="space-y-1.5 text-sm text-indigo-800">
              <li><span className="font-bold">1.</span> Read the questions first (30 sec) — not the answers, just the question stems.</li>
              <li><span className="font-bold">2.</span> Skim the passage (2–3 min) to build a mental map: what is each paragraph about?</li>
              <li><span className="font-bold">3.</span> Answer each question by going back to the relevant paragraph.</li>
            </ol>
            <p className="text-xs text-indigo-600 mt-2.5 font-medium">Best for: most students. Lets you target your reading.</p>
          </div>
          <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50">
            <p className="text-sm font-bold text-slate-800 mb-2">Read Then Answer</p>
            <ol className="space-y-1.5 text-sm text-slate-700">
              <li><span className="font-bold">1.</span> Read the full passage carefully (5–7 min), taking brief notes on each paragraph.</li>
              <li><span className="font-bold">2.</span> Answer all questions after reading, using your notes to locate answers.</li>
            </ol>
            <p className="text-xs text-slate-500 mt-2.5 font-medium">Best for: strong readers who find scanning harder than reading.</p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
          <strong>Time budget:</strong> ~20 minutes per passage. If you&apos;re at 18 min on question 10, stop going back to the text and start guessing from the answers.
        </div>
      </Section>

      {/* ── Section 3: Question Types ───────────────────────────────────────── */}
      <Section title="Question Types & How to Attack Each" emoji="🎯">
        <div className="space-y-4">
          {[
            {
              type: 'Main Idea / Primary Purpose',
              frequency: 'Very common',
              color: 'border-l-indigo-400',
              strategy: [
                'The answer must cover the WHOLE passage, not just one section.',
                'Eliminate answers that are too narrow (only describe one paragraph) or too broad (go beyond what the passage says).',
                'Watch for answer choices that are factually true but describe a supporting detail, not the main point.',
                'Often phrased as: "What is the main purpose of this passage?" or "The passage primarily discusses…"',
              ],
            },
            {
              type: 'Detail / Fact Retrieval',
              frequency: 'Most common',
              color: 'border-l-emerald-400',
              strategy: [
                'The answer is directly stated in the passage — find the exact sentence.',
                'Use keywords from the question to locate the right paragraph quickly.',
                'Beware of answer choices that are true but not stated in this passage (outside knowledge trap).',
                'Often phrased as: "According to the passage…" or "The author states that…"',
              ],
            },
            {
              type: 'Inference / Implied',
              frequency: 'Common',
              color: 'border-l-violet-400',
              strategy: [
                'The answer is not directly stated but is strongly implied by the text.',
                'The correct answer must be the most logical conclusion from what IS stated.',
                'Eliminate choices that are possible but not specifically supported by the passage.',
                'Often phrased as: "It can be inferred…" or "The passage suggests that…"',
                'Stay close to the text — if you need to reason more than one step, it\'s probably wrong.',
              ],
            },
            {
              type: 'Vocabulary in Context',
              frequency: 'Common',
              color: 'border-l-amber-400',
              strategy: [
                'Read the full sentence (and often the surrounding sentences) where the word appears.',
                'Substitute each answer choice into the sentence and see which makes the most sense in context.',
                'The correct answer matches the meaning the author intends, not necessarily the word\'s most common definition.',
                'Often phrased as: "As used in paragraph 3, the word ___ most nearly means…"',
              ],
            },
            {
              type: 'Tone / Author\'s Attitude',
              frequency: 'Occasional',
              color: 'border-l-rose-400',
              strategy: [
                'Look for emotionally loaded words, qualifiers, and the author\'s evaluative language.',
                'Neutral/objective ≠ no opinion. Many science passages are objective but have a bias toward a conclusion.',
                'Common traps: "enthusiastic" (too strong) vs. "supportive" (appropriate level).',
                'Consider: Is the author advocating for something? Reporting neutrally? Critiquing?',
              ],
            },
            {
              type: 'Except / Not / Least',
              frequency: 'Common',
              color: 'border-l-red-400',
              strategy: [
                'Circle or underline EXCEPT/NOT/LEAST — these are easy to miss under time pressure.',
                'Four answers will be true according to the passage. You want the one that is FALSE or not mentioned.',
                'Check each answer choice against the passage systematically — don\'t rely on memory.',
                'Often the easiest type to get right if you read carefully, but easiest to miss if you rush.',
              ],
            },
          ].map((qt) => (
            <div key={qt.type} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${qt.color} p-4`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-bold text-slate-900">{qt.type}</p>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{qt.frequency}</span>
              </div>
              <ul className="space-y-1.5">
                {qt.strategy.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-slate-300 flex-shrink-0 mt-0.5">→</span>
                    <span className="leading-snug">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Section 4: Time Management ──────────────────────────────────────── */}
      <Section title="Time Management" emoji="⏱️">
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left px-3 py-2 border border-slate-200">Phase</th>
                <th className="text-left px-3 py-2 border border-slate-200">Time</th>
                <th className="text-left px-3 py-2 border border-slate-200">What to do</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Read question stems', '30–45 sec', 'Scan all questions — NOT the answer choices. Note which ask for specific facts vs. main idea.'],
                ['Skim passage', '2–3 min', 'Read first and last sentence of each paragraph. Build a mental map: "para 1 = intro, para 2 = mechanism, para 3 = implications…"'],
                ['Answer questions', '15–16 min', 'For each question, find the relevant paragraph, re-read 2–3 sentences, choose the answer.'],
                ['Review flagged', '1–2 min', 'Return to questions you skipped. Guess if still unsure — no penalty for wrong answers.'],
              ].map(([phase, time, desc]) => (
                <tr key={phase} className="border-b border-slate-100">
                  <td className="px-3 py-2.5 border border-slate-200 font-semibold text-slate-800 whitespace-nowrap">{phase}</td>
                  <td className="px-3 py-2.5 border border-slate-200 text-indigo-600 font-semibold whitespace-nowrap">{time}</td>
                  <td className="px-3 py-2.5 border border-slate-200 text-slate-600 leading-snug">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
          <strong>Running out of time?</strong> Pick a default letter (B or C) and bubble the remaining questions. Random guessing on 5 questions loses you less time than spending 5 minutes on 2 questions.
        </div>
      </Section>

      {/* ── Section 5: Common Traps ─────────────────────────────────────────── */}
      <Section title="Common Answer Choice Traps" emoji="⚠️">
        <div className="space-y-3">
          {[
            {
              trap: 'True but not in the passage',
              description: 'The answer is scientifically accurate but isn\'t actually stated or implied by the passage text. The DAT only tests what\'s in the passage.',
            },
            {
              trap: 'Too extreme / Absolute language',
              description: 'Words like "always," "never," "all," "none," "completely" are rarely correct. Look for hedging language like "often," "may," "can tend to."',
            },
            {
              trap: 'Opposite of what the passage says',
              description: 'A well-worded wrong answer that directly contradicts the passage. Always re-read the exact relevant sentences before choosing.',
            },
            {
              trap: 'Too narrow (correct details, wrong scope)',
              description: 'For main idea questions: an answer that accurately describes one paragraph is wrong if the question asks about the whole passage.',
            },
            {
              trap: 'Plausible inference (one step too far)',
              description: 'An answer that sounds reasonable but requires reasoning that isn\'t supported by the text. Inferences must be the most direct conclusion from stated information.',
            },
            {
              trap: 'First answer choice bias',
              description: 'Under time pressure, students over-select A or B. Make sure you read all 4 choices before committing.',
            },
          ].map((item) => (
            <div key={item.trap} className="flex items-start gap-3 p-3.5 bg-white border border-slate-200 rounded-xl">
              <span className="text-red-400 flex-shrink-0 mt-0.5 text-base">✗</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.trap}</p>
                <p className="text-sm text-slate-500 mt-0.5 leading-snug">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Section 6: Practice Tips ────────────────────────────────────────── */}
      <Section title="How to Practice RC Effectively" emoji="📚">
        <ul className="space-y-3">
          {[
            'Do timed practice — RC under no time pressure is a different skill. Always set a 20-minute timer per passage.',
            'Review every wrong answer. Find the exact sentence that supports the correct answer. Understand WHY your choice was wrong.',
            'Read science articles daily (ScienceDaily, National Geographic, Scientific American). This builds passive vocabulary and familiarity with scientific writing style.',
            'For the DAT specifically: passages are dense science topics (evolution, biochemistry, geology, medicine). Practice with similar material.',
            'Don\'t re-read — practice scanning efficiently. The more you practice returning to a specific paragraph, the faster you\'ll get.',
            'Track your question-type accuracy. If you\'re missing "inference" questions more than "detail" questions, focus drill sessions on that type.',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
              <span className="text-indigo-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
              <span className="leading-snug">{tip}</span>
            </li>
          ))}
        </ul>
      </Section>

    </div>
  )
}

// ── Reusable section wrapper ──────────────────────────────────────────────────

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{emoji}</span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}
