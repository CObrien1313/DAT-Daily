import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getQuestionDate } from '@/lib/question-date'

export const maxDuration = 30

// 72 specific topics — interleaved across subjects (proportionally to each
// subject's topic count) so the daily subject varies day to day instead of
// running through long single-subject blocks. Cycles ~2.5 months before
// repeating a topic.
const DAT_SUBJECTS = [
  'Biology - Cell Structure and Organelles',
  'General Chemistry - Atomic Structure and Periodic Trends',
  'Organic Chemistry - Nomenclature and Functional Groups',
  'Biology - Mitosis and the Cell Cycle',
  'Quantitative Reasoning - Algebra and Equations',
  'General Chemistry - Chemical Bonding and Molecular Geometry',
  'Organic Chemistry - Stereochemistry and Chirality',
  'Biology - Meiosis and Gametogenesis',
  'Perceptual Ability - Angle Ranking',
  'Reading Comprehension - Scientific Passage Analysis',
  'Biology - DNA Replication',
  'General Chemistry - Stoichiometry and the Mole',
  'Organic Chemistry - Substitution Reactions (SN1 and SN2)',
  'Biology - Transcription and RNA Processing',
  'Quantitative Reasoning - Probability and Statistics',
  'General Chemistry - Gas Laws and Kinetic Molecular Theory',
  'Organic Chemistry - Elimination Reactions (E1 and E2)',
  'Biology - Translation and the Genetic Code',
  'Biology - Mendelian Genetics and Inheritance Patterns',
  'General Chemistry - Thermochemistry and Hess\'s Law',
  'Organic Chemistry - Addition Reactions to Alkenes and Alkynes',
  'Biology - Chromosomal Genetics and Linkage',
  'Quantitative Reasoning - Geometry and Trigonometry',
  'General Chemistry - Chemical Equilibrium and Le Chatelier\'s Principle',
  'Organic Chemistry - Aromatic Chemistry and Electrophilic Aromatic Substitution',
  'Biology - Evolution and Natural Selection',
  'Perceptual Ability - Hole Punching and Paper Folding',
  'Reading Comprehension - Inference and Tone Questions',
  'Biology - Population Genetics and Hardy-Weinberg',
  'General Chemistry - Acids, Bases, and pH',
  'Organic Chemistry - Carbonyl Chemistry and Nucleophilic Addition',
  'Biology - Enzymes and Enzyme Kinetics',
  'Quantitative Reasoning - Data Analysis and Graphs',
  'General Chemistry - Buffers and Titrations',
  'Organic Chemistry - Carboxylic Acids and Derivatives',
  'Biology - Cellular Respiration and ATP Production',
  'Biology - Photosynthesis',
  'General Chemistry - Electrochemistry and Redox Reactions',
  'Organic Chemistry - Amines and Nitrogen Compounds',
  'Biology - Membrane Transport and Cell Signaling',
  'Quantitative Reasoning - Rates, Ratios, and Proportions',
  'General Chemistry - Reaction Kinetics and Rate Laws',
  'Organic Chemistry - Alcohols, Ethers, and Epoxides',
  'Biology - The Immune System',
  'Perceptual Ability - Cube Counting',
  'Reading Comprehension - Main Idea and Detail Extraction',
  'Biology - The Nervous System and Action Potentials',
  'General Chemistry - Solutions and Colligative Properties',
  'Organic Chemistry - Aldehydes and Ketones',
  'Biology - The Endocrine System',
  'Quantitative Reasoning - Applied Mathematics and Word Problems',
  'General Chemistry - Nuclear Chemistry and Radioactive Decay',
  'Organic Chemistry - Carbohydrates and Biochemistry',
  'Biology - Cardiovascular and Respiratory Systems',
  'Biology - Digestive and Excretory Systems',
  'General Chemistry - Intermolecular Forces and Phase Changes',
  'Organic Chemistry - Lipids and Amino Acids',
  'Biology - Musculoskeletal System',
  'Quantitative Reasoning - Logarithms and Exponential Functions',
  'General Chemistry - Oxidation States and Nomenclature',
  'Organic Chemistry - Spectroscopy (IR, NMR, Mass Spec)',
  'Biology - Reproductive Systems and Embryology',
  'Perceptual Ability - Pattern and Shape Analysis',
  'Reading Comprehension - Vocabulary in Context',
  'Biology - Taxonomy and Diversity of Life',
  'General Chemistry - Solubility and Ksp',
  'Organic Chemistry - Reaction Mechanisms and Intermediates',
  'Biology - Ecology and Ecosystem Dynamics',
  'Quantitative Reasoning - Number Theory and Sequences',
  'General Chemistry - Thermodynamics and Gibbs Free Energy',
  'Organic Chemistry - Multi-Step Synthesis',
  'Biology - Viruses and Bacteria',
]

interface GeneratedQuestion {
  subject: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation: string
}

function extractJSON<T>(text: string): T | null {
  for (const s of [
    text.trim(),
    text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim(),
  ]) {
    try { return JSON.parse(s) as T } catch { /* continue */ }
  }
  let start = -1, depth = 0, inString = false, escape = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (escape) { escape = false; continue }
    if (c === '\\' && inString) { escape = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue
    if (c === '{') { if (depth === 0) start = i; depth++ }
    else if (c === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        try { return JSON.parse(text.slice(start, i + 1)) as T } catch { start = -1 }
      }
    }
  }
  return null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const questionDate = getQuestionDate()
  const force = new URL(request.url).searchParams.get('force') === 'true'

  // If force-regenerating, delete the cached question first
  if (force) {
    await supabase.from('daily_questions').delete().eq('question_date', questionDate)
  }

  // Return existing question if already generated for today
  if (!force) {
    const { data: existing } = await supabase
      .from('daily_questions')
      .select('*')
      .eq('question_date', questionDate)
      .single()

    if (existing) return NextResponse.json(existing)
  }

  // Generate a new question with Claude
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  // Pick subject and correct-answer slot deterministically from the date
  // so all users get the same question. Using different offsets so subject
  // and slot don't cycle in lockstep.
  const dateNum     = parseInt(questionDate.replace(/-/g, ''), 10)
  const subject     = DAT_SUBJECTS[dateNum % DAT_SUBJECTS.length]
  const SLOTS       = ['a', 'b', 'c', 'd'] as const
  // Use a different prime-offset combination so correct slot rotates daily
  // and is not correlated with the subject cycle.
  const correctSlot = SLOTS[(dateNum * 3 + 2) % 4]

  const subjectInstructions: Record<string, string> = {
    'Perceptual Ability - Angle Ranking': 'Describe 4 angles in words (e.g. "an angle that opens to about 30 degrees") and ask which is largest or smallest.',
    'Perceptual Ability - Hole Punching and Paper Folding': 'Describe a paper-folding and hole-punching sequence in words and ask where holes appear when unfolded.',
    'Perceptual Ability - Cube Counting': 'Describe a 3D arrangement of stacked cubes in words and ask how many cubes have exactly N faces painted.',
    'Perceptual Ability - Pattern and Shape Analysis': 'Describe a visual pattern or shape transformation in words and ask what comes next or what the result looks like.',
    'Reading Comprehension - Scientific Passage Analysis': 'Provide a 4-sentence scientific passage, then ask a specific detail question about it.',
    'Reading Comprehension - Inference and Tone Questions': 'Provide a 4-sentence scientific passage, then ask an inference or tone question.',
    'Reading Comprehension - Main Idea and Detail Extraction': 'Provide a 4-sentence scientific passage, then ask for the main idea or a supporting detail.',
    'Reading Comprehension - Vocabulary in Context': 'Provide a 3-sentence passage with a challenging scientific word used in context, then ask for its meaning.',
  }
  const extra = subjectInstructions[subject] ?? ''

  const client = new Anthropic()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: 'You are a DAT exam expert. You will reason through the problem carefully before producing your final answer.',
    messages: [{
      role: 'user',
      content: `Generate one challenging DAT practice question on the topic: ${subject}.
${extra}

INSTRUCTIONS:
1. First, reason through the topic and determine a clear, factually correct question and the single best correct answer. Show your thinking.
2. Then place the correct answer in option_${correctSlot} and fill the other three options with plausible wrong answers based on common student mistakes (e.g. wrong formula, unit error, sign error, off-by-one).
3. Set correct_option to "${correctSlot}".
4. Write a 2–3 sentence explanation starting with "Option ${correctSlot.toUpperCase()} is correct because..." then briefly explain why each wrong option is incorrect.

After your reasoning, output ONLY this JSON block (no markdown fences):
{
  "subject": "${subject}",
  "question": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_option": "${correctSlot}",
  "explanation": "..."
}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const parsed = extractJSON<GeneratedQuestion>(raw)

  if (!parsed) {
    return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
  }

  // Strip "Category - " prefix for clean display (e.g. "Biology - Mitosis" → "Biology")
  const displaySubject = subject.includes(' - ') ? subject.split(' - ')[0] : subject

  // NOTE: we do NOT shuffle daily question options because the explanation
  // references option letters by name (e.g. "Option B is wrong because...").
  // Variety is handled purely through the prompt.

  // Upsert so concurrent requests don't conflict
  const { data: saved, error: saveErr } = await supabase
    .from('daily_questions')
    .upsert({
      question_date:  questionDate,
      subject:        displaySubject,
      question:       parsed.question,
      option_a:       parsed.option_a,
      option_b:       parsed.option_b,
      option_c:       parsed.option_c,
      option_d:       parsed.option_d,
      correct_option: parsed.correct_option,
      explanation:    parsed.explanation,
    }, { onConflict: 'question_date' })
    .select()
    .single()

  if (saveErr || !saved) {
    // Another request beat us to it — fetch whatever is there
    const { data: fallback } = await supabase
      .from('daily_questions')
      .select('*')
      .eq('question_date', questionDate)
      .single()
    if (fallback) return NextResponse.json(fallback)
    return NextResponse.json({ error: 'Failed to save question' }, { status: 500 })
  }

  return NextResponse.json(saved)
}
