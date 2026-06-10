import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getQuestionDate } from '@/lib/question-date'

export const maxDuration = 30

// 72 specific topics — cycles ~2.5 months before repeating a subject area
const DAT_SUBJECTS = [
  // Biology (24 topics)
  'Biology - Cell Structure and Organelles',
  'Biology - Mitosis and the Cell Cycle',
  'Biology - Meiosis and Gametogenesis',
  'Biology - DNA Replication',
  'Biology - Transcription and RNA Processing',
  'Biology - Translation and the Genetic Code',
  'Biology - Mendelian Genetics and Inheritance Patterns',
  'Biology - Chromosomal Genetics and Linkage',
  'Biology - Evolution and Natural Selection',
  'Biology - Population Genetics and Hardy-Weinberg',
  'Biology - Enzymes and Enzyme Kinetics',
  'Biology - Cellular Respiration and ATP Production',
  'Biology - Photosynthesis',
  'Biology - Membrane Transport and Cell Signaling',
  'Biology - The Immune System',
  'Biology - The Nervous System and Action Potentials',
  'Biology - The Endocrine System',
  'Biology - Cardiovascular and Respiratory Systems',
  'Biology - Digestive and Excretory Systems',
  'Biology - Musculoskeletal System',
  'Biology - Reproductive Systems and Embryology',
  'Biology - Taxonomy and Diversity of Life',
  'Biology - Ecology and Ecosystem Dynamics',
  'Biology - Viruses and Bacteria',

  // General Chemistry (16 topics)
  'General Chemistry - Atomic Structure and Periodic Trends',
  'General Chemistry - Chemical Bonding and Molecular Geometry',
  'General Chemistry - Stoichiometry and the Mole',
  'General Chemistry - Gas Laws and Kinetic Molecular Theory',
  'General Chemistry - Thermochemistry and Hess\'s Law',
  'General Chemistry - Chemical Equilibrium and Le Chatelier\'s Principle',
  'General Chemistry - Acids, Bases, and pH',
  'General Chemistry - Buffers and Titrations',
  'General Chemistry - Electrochemistry and Redox Reactions',
  'General Chemistry - Reaction Kinetics and Rate Laws',
  'General Chemistry - Solutions and Colligative Properties',
  'General Chemistry - Nuclear Chemistry and Radioactive Decay',
  'General Chemistry - Intermolecular Forces and Phase Changes',
  'General Chemistry - Oxidation States and Nomenclature',
  'General Chemistry - Solubility and Ksp',
  'General Chemistry - Thermodynamics and Gibbs Free Energy',

  // Organic Chemistry (16 topics)
  'Organic Chemistry - Nomenclature and Functional Groups',
  'Organic Chemistry - Stereochemistry and Chirality',
  'Organic Chemistry - Substitution Reactions (SN1 and SN2)',
  'Organic Chemistry - Elimination Reactions (E1 and E2)',
  'Organic Chemistry - Addition Reactions to Alkenes and Alkynes',
  'Organic Chemistry - Aromatic Chemistry and Electrophilic Aromatic Substitution',
  'Organic Chemistry - Carbonyl Chemistry and Nucleophilic Addition',
  'Organic Chemistry - Carboxylic Acids and Derivatives',
  'Organic Chemistry - Amines and Nitrogen Compounds',
  'Organic Chemistry - Alcohols, Ethers, and Epoxides',
  'Organic Chemistry - Aldehydes and Ketones',
  'Organic Chemistry - Carbohydrates and Biochemistry',
  'Organic Chemistry - Lipids and Amino Acids',
  'Organic Chemistry - Spectroscopy (IR, NMR, Mass Spec)',
  'Organic Chemistry - Reaction Mechanisms and Intermediates',
  'Organic Chemistry - Multi-Step Synthesis',

  // Quantitative Reasoning (8 topics)
  'Quantitative Reasoning - Algebra and Equations',
  'Quantitative Reasoning - Probability and Statistics',
  'Quantitative Reasoning - Geometry and Trigonometry',
  'Quantitative Reasoning - Data Analysis and Graphs',
  'Quantitative Reasoning - Rates, Ratios, and Proportions',
  'Quantitative Reasoning - Applied Mathematics and Word Problems',
  'Quantitative Reasoning - Logarithms and Exponential Functions',
  'Quantitative Reasoning - Number Theory and Sequences',

  // PAT (4 topics)
  'Perceptual Ability - Angle Ranking',
  'Perceptual Ability - Hole Punching and Paper Folding',
  'Perceptual Ability - Cube Counting',
  'Perceptual Ability - Pattern and Shape Analysis',

  // Reading Comprehension (4 topics)
  'Reading Comprehension - Scientific Passage Analysis',
  'Reading Comprehension - Inference and Tone Questions',
  'Reading Comprehension - Main Idea and Detail Extraction',
  'Reading Comprehension - Vocabulary in Context',
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
  const correctSlot = SLOTS[Math.floor(dateNum / DAT_SUBJECTS.length) % 4]

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
    max_tokens: 1024,
    system: 'You are a DAT exam expert. Output ONLY raw JSON — no markdown fences, no explanation.',
    messages: [{
      role: 'user',
      content: `Generate one challenging DAT practice question on the topic: ${subject}.
${extra}

INSTRUCTIONS:
1. Work out the full correct answer completely before writing any JSON.
2. The correct answer MUST go in option_${correctSlot}. This is mandatory.
3. Fill the other three options with plausible wrong answers based on specific student mistakes (e.g. wrong formula, unit error, sign error).
4. Set correct_option to "${correctSlot}".
5. explanation: 2–3 sentences. Start with "Option ${correctSlot.toUpperCase()} is correct because..." then briefly explain why each wrong option is wrong.

Return ONLY this JSON (no extra text, no markdown):
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
