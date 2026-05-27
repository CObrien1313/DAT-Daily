'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Formula data ──────────────────────────────────────────────────────────────

interface Formula {
  name: string
  formula: string
  note?: string
}

interface Section {
  title: string
  formulas: Formula[]
}

interface SubjectData {
  id: string
  label: string
  emoji: string
  color: string        // Tailwind tab active classes
  sections: Section[]
}

const SUBJECTS: SubjectData[] = [
  {
    id: 'gchem',
    label: 'Gen Chem',
    emoji: '⚗️',
    color: 'bg-blue-600 text-white border-blue-600',
    sections: [
      {
        title: 'Gas Laws',
        formulas: [
          { name: 'Ideal Gas Law', formula: 'PV = nRT', note: 'R = 0.0821 L·atm/mol·K; T in Kelvin' },
          { name: 'Boyle\'s Law', formula: 'P₁V₁ = P₂V₂', note: 'Constant T and n' },
          { name: 'Charles\'s Law', formula: 'V₁/T₁ = V₂/T₂', note: 'Constant P and n; T in Kelvin' },
          { name: 'Gay-Lussac\'s Law', formula: 'P₁/T₁ = P₂/T₂', note: 'Constant V and n' },
          { name: 'Combined Gas Law', formula: 'P₁V₁/T₁ = P₂V₂/T₂', note: 'Constant n only' },
          { name: 'Dalton\'s Law', formula: 'P_total = P₁ + P₂ + P₃ + …', note: 'Partial pressures of a gas mixture' },
        ],
      },
      {
        title: 'Thermodynamics',
        formulas: [
          { name: 'Gibbs Free Energy', formula: 'ΔG = ΔH − TΔS', note: 'ΔG < 0 = spontaneous; ΔG > 0 = non-spontaneous' },
          { name: 'Standard Gibbs + Equilibrium', formula: 'ΔG° = −RT ln(K)', note: 'K > 1 → ΔG° < 0 → products favored' },
          { name: 'Hess\'s Law', formula: 'ΔH_rxn = Σ ΔH_f°(products) − Σ ΔH_f°(reactants)', note: 'Enthalpy is a state function' },
          { name: 'Heat Transfer', formula: 'q = mcΔT', note: 'm = mass (g), c = specific heat, ΔT = temperature change' },
          { name: 'Entropy', formula: 'ΔS_universe = ΔS_system + ΔS_surroundings > 0 (spontaneous)' },
        ],
      },
      {
        title: 'Equilibrium & Acid-Base',
        formulas: [
          { name: 'Henderson-Hasselbalch', formula: 'pH = pKa + log([A⁻]/[HA])', note: 'Buffer equation; when [A⁻]=[HA], pH = pKa' },
          { name: 'Water autoionization', formula: 'Kw = [H⁺][OH⁻] = 1×10⁻¹⁴ (25°C)' },
          { name: 'Conjugate pair relationship', formula: 'Ka × Kb = Kw;  pKa + pKb = 14' },
          { name: 'Weak acid approximation', formula: '[H⁺] ≈ √(Ka × C)', note: 'Valid when C/Ka > 100' },
          { name: 'pH definition', formula: 'pH = −log[H⁺]', note: 'Similarly: pOH = −log[OH⁻]; pH + pOH = 14' },
          { name: 'Equilibrium constant', formula: 'Kc = [products]^coeff / [reactants]^coeff', note: 'Pure solids and liquids excluded' },
        ],
      },
      {
        title: 'Electrochemistry',
        formulas: [
          { name: 'Standard cell potential', formula: 'E°_cell = E°_cathode − E°_anode', note: 'Positive E° = spontaneous' },
          { name: 'Gibbs and EMF', formula: 'ΔG° = −nFE°', note: 'F = 96,485 C/mol' },
          { name: 'Nernst Equation', formula: 'E = E° − (0.0592/n) log(Q)', note: 'At 25°C; n = moles e⁻ transferred' },
          { name: 'Electrolysis (Faraday)', formula: 'moles e⁻ = It/F', note: 'I = current (A), t = time (s)' },
        ],
      },
      {
        title: 'Solutions & Kinetics',
        formulas: [
          { name: 'Molarity', formula: 'M = mol solute / L solution' },
          { name: 'Molality', formula: 'm = mol solute / kg solvent', note: 'Used for colligative properties' },
          { name: 'Dilution', formula: 'M₁V₁ = M₂V₂' },
          { name: 'Colligative: boiling point', formula: 'ΔTb = Kb × m × i', note: 'i = van\'t Hoff factor' },
          { name: 'Colligative: freezing point', formula: 'ΔTf = Kf × m × i' },
          { name: 'Osmotic pressure', formula: 'π = MRT' },
          { name: 'Beer-Lambert Law', formula: 'A = εlc', note: 'ε = molar absorptivity, l = path length (cm)' },
          { name: 'Rate Law', formula: 'rate = k[A]ᵐ[B]ⁿ', note: 'm, n from experiment; overall order = m+n' },
          { name: 'Arrhenius Equation', formula: 'k = Ae^(−Ea/RT)', note: 'Higher T or lower Ea → larger k' },
          { name: 'First-order half-life', formula: 't½ = ln(2)/k = 0.693/k', note: 'Most common type on DAT' },
        ],
      },
    ],
  },

  {
    id: 'orgo',
    label: 'Orgo',
    emoji: '🧪',
    color: 'bg-violet-600 text-white border-violet-600',
    sections: [
      {
        title: 'Substitution Reactions',
        formulas: [
          { name: 'SN2', formula: 'Nu⁻ + R–LG → R–Nu + LG⁻ (one step, backside)', note: '1° > 2° >> 3°; polar aprotic solvent; strong Nu; inversion of config' },
          { name: 'SN1', formula: 'R–LG → R⁺ + LG⁻ → R–Nu (two steps)', note: '3° > 2° >> 1°; polar protic solvent; weak Nu; racemization' },
        ],
      },
      {
        title: 'Elimination Reactions',
        formulas: [
          { name: 'E2', formula: 'Anti-periplanar H and LG; strong base, heat', note: 'Zaitsev (most substituted) or Hofmann (bulky base)' },
          { name: 'E1', formula: 'Carbocation intermediate; weak base; Zaitsev product', note: 'Competes with SN1; 3° favored' },
        ],
      },
      {
        title: 'Addition Reactions',
        formulas: [
          { name: 'Markovnikov (HX)', formula: 'H adds to C with more H\'s; X to more substituted C', note: 'Proceeds through most stable carbocation' },
          { name: 'Anti-Markovnikov (radical)', formula: 'HBr + ROOR (peroxides): Br to less substituted C', note: 'Only HBr; not HCl or HI' },
          { name: 'Halogenation of alkene', formula: 'X₂ / CCl₄: anti addition of X across double bond' },
          { name: 'Hydroboration-Oxidation', formula: 'BH₃ then H₂O₂/NaOH: anti-Markovnikov, syn addition, alcohol product' },
          { name: 'Ozonolysis', formula: 'O₃ / Zn,H₂O: reductive → aldehydes + ketones at C=C', note: 'Oxidative (H₂O₂): aldehydes → carboxylic acids' },
          { name: 'Diels-Alder', formula: '[4+2] cycloaddition: conjugated diene + dienophile → cyclohexene', note: 'Diene must be s-cis; syn addition; EWG on dienophile accelerates' },
        ],
      },
      {
        title: 'Carbonyl Chemistry',
        formulas: [
          { name: 'Fischer Esterification', formula: 'RCOOH + R\'OH ⇌ RCOOR\' + H₂O (H⁺ cat.)', note: 'Reversible; remove water to drive forward' },
          { name: 'Grignard', formula: 'RMgX + carbonyl → alcohol', note: 'Aldehyde → 2°; Ketone → 3°; HCHO → 1°; CO₂ → RCOOH' },
          { name: 'Aldol', formula: 'Enolate + carbonyl → β-hydroxy carbonyl (base cat.)', note: 'Condensation: loses H₂O to give α,β-unsaturated product' },
          { name: 'Wittig', formula: 'Ph₃P=CR₂ + C=O → alkene + Ph₃P=O', note: 'Makes alkenes with exact double bond position' },
          { name: 'Reductions', formula: 'LiAlH₄: reduces ketone, aldehyde, ester, acid, amide\nNaBH₄: only ketones and aldehydes' },
          { name: 'Acyl substitution reactivity', formula: 'Acid chloride > Anhydride > Ester > Amide', note: 'Better leaving group = more reactive' },
        ],
      },
      {
        title: 'Stereochemistry',
        formulas: [
          { name: 'CIP Priority Rules', formula: 'Higher atomic number = higher priority\nTies: go to next atoms; double bond = two copies of atom' },
          { name: 'R vs S assignment', formula: 'Orient #4 away; 1→2→3 clockwise = R; counterclockwise = S' },
          { name: 'Optical rotation', formula: 'Enantiomers: equal and opposite rotation\nRacemic mixture: no net rotation' },
          { name: 'Degrees of unsaturation', formula: 'DoU = (2C + 2 + N − H − X) / 2', note: 'Each ring or π bond = 1 DoU; benzene = 4 DoU' },
        ],
      },
      {
        title: 'Spectroscopy (IR / NMR key values)',
        formulas: [
          { name: 'IR: O–H (alcohol)', formula: '~3200–3550 cm⁻¹ (broad)' },
          { name: 'IR: N–H', formula: '~3300 cm⁻¹ (sharp, 1 or 2 peaks)' },
          { name: 'IR: C≡C or C≡N', formula: '~2100–2260 cm⁻¹' },
          { name: 'IR: C=O (carbonyl)', formula: '~1710 cm⁻¹ (ketone); ~1735 (ester); ~1715 (acid); ~1800 (acid chloride)' },
          { name: 'NMR: TMS reference', formula: 'δ = 0 ppm; more shielded (upfield) = smaller δ' },
          { name: 'NMR: n+1 rule', formula: 'Splits into n+1 peaks where n = number of adjacent H\'s' },
        ],
      },
    ],
  },

  {
    id: 'bio',
    label: 'Biology',
    emoji: '🧬',
    color: 'bg-emerald-600 text-white border-emerald-600',
    sections: [
      {
        title: 'Genetics',
        formulas: [
          { name: 'Hardy-Weinberg', formula: 'p² + 2pq + q² = 1;  p + q = 1', note: 'p² = homo dom; 2pq = hetero; q² = homo rec' },
          { name: 'F2 Monohybrid ratio', formula: 'Phenotype 3:1; Genotype 1:2:1' },
          { name: 'F2 Dihybrid ratio', formula: 'Phenotype 9:3:3:1' },
          { name: 'Testcross', formula: 'Unknown × homozygous recessive; reveals genotype of unknown' },
          { name: 'Sex linkage', formula: 'X-linked recessive: carrier females (X^A X^a) pass to sons; affected males (X^a Y)' },
          { name: 'Chi-square', formula: 'χ² = Σ (O − E)² / E', note: 'Tests whether observed ratios fit expected; df = n − 1' },
        ],
      },
      {
        title: 'Cell Biology',
        formulas: [
          { name: 'Cell cycle phases', formula: 'G1 → S (DNA replication) → G2 → M (mitosis) → Cytokinesis' },
          { name: 'Mitosis (PMAT)', formula: 'Prophase → Metaphase → Anaphase → Telophase' },
          { name: 'Meiosis result', formula: '2n → four haploid (n) cells with genetic diversity via crossing over' },
          { name: 'DNA replication', formula: 'Semiconservative; 5\'→3\' synthesis; requires primer (RNA)' },
          { name: 'Central Dogma', formula: 'DNA → (transcription) → mRNA → (translation) → Protein' },
        ],
      },
      {
        title: 'Biochemistry & Metabolism',
        formulas: [
          { name: 'Cellular respiration ATP summary', formula: 'Glycolysis: 2 ATP (net)\nPyruvate decarboxylation: 0 ATP\nKrebs cycle: 2 ATP\nOxidative phosphorylation: ~32–34 ATP\nTotal: ~36–38 ATP per glucose' },
          { name: 'NADH and FADH₂ yields', formula: 'NADH → ~2.5 ATP; FADH₂ → ~1.5 ATP' },
          { name: 'Michaelis-Menten', formula: 'v = Vmax[S] / (Km + [S])', note: 'Km = [S] at ½Vmax; low Km = high affinity' },
          { name: 'Competitive inhibition', formula: 'Km↑, Vmax unchanged; overcome with more substrate' },
          { name: 'Non-competitive inhibition', formula: 'Km unchanged, Vmax↓; cannot overcome with more substrate' },
          { name: 'Photosynthesis summary', formula: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂\nLight rxns: ATP + NADPH\nCalvin cycle: uses ATP + NADPH → G3P' },
        ],
      },
      {
        title: 'Physiology Key Formulas',
        formulas: [
          { name: 'Cardiac output', formula: 'CO = Heart rate × Stroke volume (mL/min)' },
          { name: 'Mean arterial pressure', formula: 'MAP ≈ DBP + ⅓(SBP − DBP)' },
          { name: 'Nernst equation (membrane)', formula: 'E = (61/z) log([ion]_out / [ion]_in)', note: 'z = ion charge; at 37°C' },
          { name: 'GFR (Glomerular filtration)', formula: 'GFR = (U_Cr × V) / P_Cr', note: 'U = urine conc.; V = urine flow; P = plasma conc.' },
          { name: 'Henderson-Hasselbalch (blood)', formula: 'pH = 6.1 + log([HCO₃⁻] / 0.03 × PaCO₂)', note: 'Normal: pH 7.4, HCO₃⁻ 24 mEq/L, PaCO₂ 40 mmHg' },
        ],
      },
    ],
  },

  {
    id: 'qr',
    label: 'QR / Math',
    emoji: '📐',
    color: 'bg-rose-600 text-white border-rose-600',
    sections: [
      {
        title: 'Geometry',
        formulas: [
          { name: 'Triangle area', formula: 'A = ½bh' },
          { name: 'Triangle angle sum', formula: '∠A + ∠B + ∠C = 180°' },
          { name: 'Pythagorean theorem', formula: 'a² + b² = c²', note: 'Common triples: 3-4-5, 5-12-13, 8-15-17' },
          { name: '30-60-90 triangle', formula: 'Sides: 1 : √3 : 2  (short leg : long leg : hyp)' },
          { name: '45-45-90 triangle', formula: 'Sides: 1 : 1 : √2  (leg : leg : hyp)' },
          { name: 'Circle area', formula: 'A = πr²' },
          { name: 'Circle circumference', formula: 'C = 2πr = πd' },
          { name: 'Arc length', formula: 's = (θ/360°) × 2πr' },
          { name: 'Sector area', formula: 'A = (θ/360°) × πr²' },
          { name: 'Cylinder', formula: 'V = πr²h;  SA = 2πr² + 2πrh' },
          { name: 'Sphere', formula: 'V = (4/3)πr³;  SA = 4πr²' },
          { name: 'Cone', formula: 'V = (1/3)πr²h' },
          { name: 'SOH-CAH-TOA', formula: 'sin θ = opp/hyp;  cos θ = adj/hyp;  tan θ = opp/adj' },
        ],
      },
      {
        title: 'Algebra & Functions',
        formulas: [
          { name: 'Quadratic formula', formula: 'x = (−b ± √(b² − 4ac)) / 2a', note: 'Discriminant b²−4ac: >0 two roots, =0 one root, <0 no real roots' },
          { name: 'Slope-intercept', formula: 'y = mx + b' },
          { name: 'Point-slope', formula: 'y − y₁ = m(x − x₁)' },
          { name: 'Distance formula', formula: 'd = √((x₂−x₁)² + (y₂−y₁)²)' },
          { name: 'Midpoint', formula: 'M = ((x₁+x₂)/2, (y₁+y₂)/2)' },
          { name: 'Exponent rules', formula: 'aᵐ·aⁿ = aᵐ⁺ⁿ;  aᵐ/aⁿ = aᵐ⁻ⁿ;  (aᵐ)ⁿ = aᵐⁿ;  a⁻ⁿ = 1/aⁿ' },
          { name: 'Log rules', formula: 'log(ab) = log a + log b\nlog(a/b) = log a − log b\nlog(aⁿ) = n log a' },
          { name: 'Binomial expansions', formula: '(a+b)² = a² + 2ab + b²\n(a−b)² = a² − 2ab + b²\n(a+b)(a−b) = a² − b²' },
        ],
      },
      {
        title: 'Probability & Statistics',
        formulas: [
          { name: 'Combination', formula: 'C(n,r) = n! / [r!(n−r)!]', note: 'Order does not matter' },
          { name: 'Permutation', formula: 'P(n,r) = n! / (n−r)!', note: 'Order matters' },
          { name: 'Probability addition', formula: 'P(A or B) = P(A) + P(B) − P(A and B)' },
          { name: 'Probability multiplication', formula: 'P(A and B) = P(A) × P(B)  [independent]\nP(A and B) = P(A) × P(B|A)  [dependent]' },
          { name: 'Complement rule', formula: 'P(not A) = 1 − P(A)' },
          { name: 'Mean', formula: 'x̄ = Σxᵢ / n' },
          { name: 'Variance', formula: 'σ² = Σ(xᵢ − x̄)² / n' },
          { name: 'Standard deviation', formula: 'σ = √[Σ(xᵢ − x̄)² / n]' },
        ],
      },
      {
        title: 'Applied Math',
        formulas: [
          { name: 'Simple interest', formula: 'I = Prt;  A = P(1 + rt)' },
          { name: 'Compound interest', formula: 'A = P(1 + r/n)^(nt)' },
          { name: 'Continuous growth', formula: 'A = Pe^(rt)' },
          { name: 'Percent change', formula: '% change = (new − old) / old × 100' },
          { name: 'Distance = Rate × Time', formula: 'd = rt;  work: rate₁ + rate₂ = 1/t_combined' },
          { name: 'Arithmetic sequence', formula: 'aₙ = a₁ + (n−1)d;  Sₙ = n(a₁ + aₙ)/2' },
          { name: 'Geometric sequence', formula: 'aₙ = a₁·rⁿ⁻¹;  Sₙ = a₁(1−rⁿ)/(1−r)' },
          { name: 'Infinite geometric sum', formula: 'S∞ = a₁/(1−r)  when |r| < 1' },
        ],
      },
    ],
  },
]

// ── Page component ────────────────────────────────────────────────────────────

export default function FormulasPage() {
  const [activeId, setActiveId] = useState(SUBJECTS[0].id)
  const subject = SUBJECTS.find((s) => s.id === activeId) ?? SUBJECTS[0]

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
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
          <FlaskConical className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Formula Sheets</h1>
        </div>
        <p className="text-sm text-slate-500">High-yield formulas organized by subject. Use alongside your study sessions.</p>
      </div>

      {/* Subject tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveId(s.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all',
              activeId === s.id
                ? s.color
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
            )}
          >
            <span>{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Formula sections */}
      <div className="space-y-5">
        {subject.sections.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{section.title}</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {section.formulas.map((f) => (
                <div key={f.name} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="sm:w-56 flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{f.name}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-medium text-slate-900 whitespace-pre-line leading-relaxed">{f.formula}</p>
                    {f.note && (
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{f.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
