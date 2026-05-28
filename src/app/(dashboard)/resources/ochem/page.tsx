'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Data ──────────────────────────────────────────────────────────────────────

interface Reaction {
  name: string
  reactants: string
  reagents: string
  product: string
  mechanism?: string
  note?: string
}

interface ReactionGroup {
  title: string
  reactions: Reaction[]
}

const GROUPS: ReactionGroup[] = [
  {
    title: 'Substitution Reactions',
    reactions: [
      {
        name: 'SN2 — Nucleophilic Substitution',
        reactants: 'Primary (or secondary) alkyl halide',
        reagents: 'Strong nucleophile (Nu⁻), polar aprotic solvent (DMF, DMSO, acetone)',
        product: 'R–Nu (inverted configuration)',
        mechanism: 'Concerted backside attack; one transition state',
        note: 'Order: 1° >> 2° >> 3° (fails at tertiary). Nu attacks as LG leaves.',
      },
      {
        name: 'SN1 — Unimolecular Substitution',
        reactants: 'Tertiary (or secondary) alkyl halide',
        reagents: 'Weak nucleophile, polar protic solvent (H₂O, ROH, acetic acid)',
        product: 'R–Nu (racemic mixture)',
        mechanism: 'Two steps: carbocation intermediate → Nu attacks either face',
        note: 'Order: 3° >> 2° >> 1°. Favors rearrangements (hydride/alkyl shifts).',
      },
      {
        name: 'Nucleophilic Acyl Substitution (at ester)',
        reactants: 'Ester (RCOOR\')',
        reagents: 'Nu⁻ (H₂O, ROH, RNH₂, RMgX) ± acid/base catalyst',
        product: 'New carbonyl compound (acid, new ester, amide, alcohol)',
        mechanism: 'Tetrahedral intermediate; OR\' is the leaving group',
        note: 'Reactivity: acid chloride > anhydride > ester > amide',
      },
      {
        name: 'Fischer Esterification',
        reactants: 'Carboxylic acid (RCOOH)',
        reagents: 'Alcohol (R\'OH), H₂SO₄ or HCl (cat.), heat',
        product: 'Ester (RCOOR\') + H₂O',
        mechanism: 'Nucleophilic acyl substitution via tetrahedral intermediate',
        note: 'Reversible — remove H₂O (Dean-Stark trap) to drive equilibrium right.',
      },
      {
        name: 'Aromatic Nucleophilic Substitution (SNAr)',
        reactants: 'Aryl halide with strong EWG ortho/para',
        reagents: 'Strong nucleophile (Nu⁻), polar aprotic solvent, heat',
        product: 'Ar–Nu',
        mechanism: 'Meisenheimer complex (addition-elimination)',
        note: 'Requires EWG (NO₂, CN) to stabilize the anionic intermediate.',
      },
    ],
  },
  {
    title: 'Elimination Reactions',
    reactions: [
      {
        name: 'E2 — Bimolecular Elimination',
        reactants: 'Alkyl halide (any degree)',
        reagents: 'Strong, bulky base (KOH/EtOH, t-BuOK/t-BuOH), heat',
        product: 'Alkene (Zaitsev = most substituted) or Hofmann (bulky base = least substituted)',
        mechanism: 'Concerted; anti-periplanar H and LG required',
        note: 'Anti-periplanar geometry is essential. Competes with SN2.',
      },
      {
        name: 'E1 — Unimolecular Elimination',
        reactants: 'Tertiary (or secondary) alkyl halide',
        reagents: 'Weak base, heat, polar protic solvent',
        product: 'Alkene (Zaitsev product)',
        mechanism: 'Two steps: carbocation → proton removed by base',
        note: 'Competes with SN1 under same conditions. Heat favors elimination.',
      },
      {
        name: 'Dehydration of Alcohol',
        reactants: 'Alcohol (R–OH)',
        reagents: 'Conc. H₂SO₄ or H₃PO₄, heat (high temp)',
        product: 'Alkene + H₂O',
        mechanism: 'E1: protonation of OH → carbocation → loss of H⁺',
        note: 'Order of ease: 3° > 2° > 1°. Follows Zaitsev. Rearrangements possible.',
      },
      {
        name: 'Hofmann Elimination',
        reactants: 'Quaternary ammonium salt (R₄N⁺ X⁻)',
        reagents: 'AgOH (or Ag₂O), then heat (Hofmann exhaustive methylation)',
        product: 'Least substituted alkene (Hofmann product) + tertiary amine',
        mechanism: 'E2 with N as leaving group; large N disfavors Zaitsev approach',
        note: 'Opposite of Zaitsev — used to identify amine structure.',
      },
    ],
  },
  {
    title: 'Additions to Alkenes & Alkynes',
    reactions: [
      {
        name: 'HX Addition (Markovnikov)',
        reactants: 'Alkene',
        reagents: 'HCl, HBr, or HI (no peroxides)',
        product: 'Alkyl halide — X on more substituted C (Markovnikov)',
        mechanism: 'Electrophilic addition; most stable carbocation intermediate',
        note: 'Rate: HI > HBr > HCl. Markovnikov = "rich get richer."',
      },
      {
        name: 'HBr Radical Addition (Anti-Markovnikov)',
        reactants: 'Alkene',
        reagents: 'HBr, ROOR (peroxides) or hν',
        product: 'Alkyl bromide — Br on less substituted C',
        mechanism: 'Free radical chain mechanism',
        note: 'ONLY works for HBr (not HCl or HI). Peroxides or light required.',
      },
      {
        name: 'Halogenation of Alkene',
        reactants: 'Alkene',
        reagents: 'Br₂ or Cl₂ / CCl₄ (non-polar solvent)',
        product: 'Vicinal dihalide — anti addition across double bond',
        mechanism: 'Bromonium ion intermediate → backside attack by Br⁻',
        note: 'Bromine test: Br₂ decolorized → positive for unsaturation.',
      },
      {
        name: 'Halohydrin Formation',
        reactants: 'Alkene',
        reagents: 'X₂ / H₂O (halogen + water)',
        product: 'Halohydrin — X and OH on adjacent carbons, anti addition',
        mechanism: 'Halonium ion → H₂O attacks more substituted carbon (Markovnikov)',
        note: 'OH ends up on more substituted C; X on less substituted C.',
      },
      {
        name: 'Acid-Catalyzed Hydration',
        reactants: 'Alkene',
        reagents: 'H₂SO₄ (cat.), H₂O, heat',
        product: 'Alcohol — Markovnikov addition of OH',
        mechanism: 'Protonation → carbocation → H₂O attacks',
        note: 'Follows Markovnikov. Rearrangements possible.',
      },
      {
        name: 'Oxymercuration-Demercuration',
        reactants: 'Alkene',
        reagents: '1) Hg(OAc)₂, H₂O  2) NaBH₄',
        product: 'Markovnikov alcohol (no rearrangement)',
        mechanism: 'Mercurinium ion → attack by H₂O → NaBH₄ reduces',
        note: 'Preferred over acid hydration when no rearrangement is desired.',
      },
      {
        name: 'Hydroboration-Oxidation',
        reactants: 'Alkene',
        reagents: '1) BH₃·THF  2) H₂O₂, NaOH',
        product: 'Anti-Markovnikov alcohol; syn addition',
        mechanism: 'Concerted syn delivery of B and H; then oxidation replaces B with OH',
        note: 'Both B and H add to same face (syn). OH on less substituted C.',
      },
      {
        name: 'Catalytic Hydrogenation',
        reactants: 'Alkene or alkyne',
        reagents: 'H₂, Pt/Pd/Ni catalyst (heterogeneous)',
        product: 'Alkane; syn addition of H₂',
        mechanism: 'Surface adsorption of alkene; H₂ adds to same face',
        note: 'Lindlar\'s catalyst (Pd/CaCO₃ + quinoline): partial reduction of alkyne → cis alkene only.',
      },
      {
        name: 'Ozonolysis — Reductive',
        reactants: 'Alkene',
        reagents: '1) O₃  2) Zn/H₂O (or DMS)',
        product: 'Aldehydes and/or ketones (cleaves C=C)',
        note: 'Monosubstituted C → aldehyde; disubstituted C → ketone.',
      },
      {
        name: 'Ozonolysis — Oxidative',
        reactants: 'Alkene',
        reagents: '1) O₃  2) H₂O₂ (or KMnO₄, hot)',
        product: 'Ketones and carboxylic acids (aldehydes oxidized to acids)',
        note: 'Disubstituted C still → ketone; monosubstituted C → carboxylic acid.',
      },
      {
        name: 'Diels-Alder',
        reactants: 'Conjugated diene (s-cis) + dienophile (C=C)',
        reagents: 'Heat; EWG on dienophile accelerates (Lewis acid cat. also used)',
        product: 'Cyclohexene; syn addition (cis rule)',
        mechanism: '[4+2] pericyclic cycloaddition — concerted, no intermediates',
        note: 'endo product is kinetic product (more common on DAT). Retro-Diels-Alder at high T.',
      },
      {
        name: 'Epoxidation',
        reactants: 'Alkene',
        reagents: 'mCPBA (meta-chloroperoxybenzoic acid) or RCO₃H',
        product: 'Epoxide (3-membered ring with O); syn addition',
        note: 'Epoxides are strained and very reactive toward nucleophiles (ring opening).',
      },
    ],
  },
  {
    title: 'Carbonyl & Carboxylic Acid Chemistry',
    reactions: [
      {
        name: 'Nucleophilic Addition to Aldehyde/Ketone',
        reactants: 'Aldehyde or ketone',
        reagents: 'Nu⁻ (CN⁻, RMgX, LiAlH₄, NaBH₄, RNH₂, etc.)',
        product: 'Alcohol (or imine, enamine) depending on Nu',
        mechanism: 'Nu attacks carbonyl C → tetrahedral alkoxide → protonation',
        note: 'Aldehydes more reactive than ketones (less steric, less e⁻ donation).',
      },
      {
        name: 'Grignard Addition to Carbonyl',
        reactants: 'RMgX (Grignard reagent)',
        reagents: 'Anhydrous ether; then H₃O⁺ workup',
        product: 'HCHO → 1° alcohol; RCHO → 2° alcohol; R₂CO → 3° alcohol; CO₂ → RCOOH; ester → 3° alcohol',
        note: 'Cannot use with O–H, N–H, or COOH in molecule (acidic H destroys Grignard).',
      },
      {
        name: 'Aldol Condensation',
        reactants: 'Aldehyde or ketone with α-H',
        reagents: 'Dilute NaOH (base cat.) or dilute HCl (acid cat.)',
        product: 'β-hydroxy carbonyl (aldol) → dehydrates to α,β-unsaturated carbonyl (condensation)',
        mechanism: 'Enolate attacks carbonyl C of second molecule',
        note: 'Condensation (dehydration) step requires heat. Intramolecular aldol → cyclic products.',
      },
      {
        name: 'Claisen Condensation',
        reactants: 'Two ester molecules with α-H',
        reagents: 'NaOEt (strong base), then H₃O⁺',
        product: 'β-ketoester',
        mechanism: 'Enolate of one ester attacks carbonyl of another; OR\' leaves',
        note: 'Dieckmann condensation = intramolecular Claisen → cyclic β-ketoester.',
      },
      {
        name: 'Wittig Reaction',
        reactants: 'Aldehyde or ketone',
        reagents: 'Phosphorus ylide (Ph₃P=CR\'R\'\')',
        product: 'Alkene + Ph₃P=O',
        note: 'Forms alkene at exact C=O position. Unstabilized ylide → cis alkene; stabilized → trans.',
      },
      {
        name: 'Imine (Schiff Base) Formation',
        reactants: 'Aldehyde or ketone',
        reagents: 'Primary amine (RNH₂), acid catalyst, remove H₂O',
        product: 'Imine (R₂C=NR\') + H₂O',
        note: 'Reversible. Requires acid catalyst and removal of H₂O to drive forward.',
      },
      {
        name: 'Acetal Formation',
        reactants: 'Aldehyde or ketone',
        reagents: '2 equiv. ROH, acid catalyst (H⁺), remove H₂O',
        product: 'Acetal (R₂C(OR\')₂) + H₂O',
        note: 'Stable under basic conditions; hydrolyzed under acidic conditions. Used as protecting group.',
      },
      {
        name: 'Reduction with LiAlH₄',
        reactants: 'Ketone, aldehyde, ester, carboxylic acid, or amide',
        reagents: 'LiAlH₄, anhydrous Et₂O, then H₃O⁺ workup',
        product: 'Alcohol (from ketone/aldehyde/ester) or primary alcohol (from carboxylic acid)',
        note: 'Strong reducer; reacts violently with protic solvents. Reduces ALL carbonyls.',
      },
      {
        name: 'Reduction with NaBH₄',
        reactants: 'Ketone or aldehyde only',
        reagents: 'NaBH₄, EtOH or H₂O',
        product: 'Secondary alcohol (from ketone) or primary alcohol (from aldehyde)',
        note: 'Mild reducer; does NOT reduce esters, carboxylic acids, or amides.',
      },
      {
        name: 'Hell-Volhard-Zelinsky (HVZ)',
        reactants: 'Carboxylic acid',
        reagents: 'Cl₂ or Br₂, PCl₃ or PBr₃ (cat.)',
        product: 'α-halocarboxylic acid',
        note: 'Halogenation alpha to the acid carbonyl. Used in synthesis of α-amino acids.',
      },
    ],
  },
  {
    title: 'Aromatic Chemistry (EAS)',
    reactions: [
      {
        name: 'Halogenation (EAS)',
        reactants: 'Benzene',
        reagents: 'Cl₂ or Br₂, FeCl₃ or FeBr₃ (Lewis acid catalyst)',
        product: 'Chlorobenzene or Bromobenzene + HX',
        mechanism: 'Lewis acid activates X₂; electrophile attacks ring; re-aromatization by deprotonation',
        note: 'No catalyst needed for very reactive rings (phenol, aniline).',
      },
      {
        name: 'Nitration (EAS)',
        reactants: 'Benzene (or substituted benzene)',
        reagents: 'Conc. HNO₃ + conc. H₂SO₄ (nitrating mixture)',
        product: 'Nitrobenzene + H₂O',
        mechanism: 'H₂SO₄ protonates HNO₃ → nitronium ion (NO₂⁺) is the electrophile',
        note: 'EWG on ring → lower reactivity, meta-directed. EDG → higher reactivity, o/p-directed.',
      },
      {
        name: 'Sulfonation (EAS)',
        reactants: 'Benzene',
        reagents: 'Fuming H₂SO₄ (oleum) or conc. H₂SO₄, heat',
        product: 'Benzenesulfonic acid',
        note: 'Reversible — dilute H₂SO₄ + heat removes SO₃H group (used as blocking group).',
      },
      {
        name: 'Friedel-Crafts Alkylation',
        reactants: 'Benzene + alkyl halide',
        reagents: 'AlCl₃ (Lewis acid), anhydrous',
        product: 'Alkylbenzene + HCl',
        note: 'Limitations: polyalkylation and carbocation rearrangements. Cannot use with EWG on ring.',
      },
      {
        name: 'Friedel-Crafts Acylation',
        reactants: 'Benzene + acyl chloride (RCOCl) or anhydride',
        reagents: 'AlCl₃, anhydrous',
        product: 'Aryl ketone (RCOC₆H₅) + HCl',
        note: 'No rearrangement (unlike alkylation). Product deactivated — no polyacylation. Then reduce to alkyl with Clemmensen.',
      },
      {
        name: 'Clemmensen Reduction',
        reactants: 'Aryl ketone (from F-C acylation)',
        reagents: 'Zn(Hg), conc. HCl, heat',
        product: 'Alkylbenzene (C=O → CH₂)',
        note: 'Used after F-C acylation to get alkyl group without carbocation rearrangements.',
      },
    ],
  },
  {
    title: 'Oxidation Reactions',
    reactions: [
      {
        name: 'Oxidation of Primary Alcohol',
        reactants: '1° Alcohol (RCH₂OH)',
        reagents: 'PCC (to aldehyde); KMnO₄ or CrO₃/H₂SO₄ (to carboxylic acid)',
        product: 'PCC → Aldehyde; KMnO₄ → Carboxylic acid',
        note: 'PCC = pyridinium chlorochromate; mild — stops at aldehyde.',
      },
      {
        name: 'Oxidation of Secondary Alcohol',
        reactants: '2° Alcohol (R₂CHOH)',
        reagents: 'PCC, CrO₃, or KMnO₄',
        product: 'Ketone',
        note: 'Ketones cannot be further oxidized under normal conditions.',
      },
      {
        name: 'Oxidation of Aldehyde',
        reactants: 'Aldehyde (RCHO)',
        reagents: 'Tollens\' reagent (Ag(NH₃)₂⁺); or Fehling\'s; or KMnO₄',
        product: 'Carboxylic acid + Ag mirror (Tollens\') or red Cu₂O (Fehling\'s)',
        note: 'Tollens\' and Fehling\'s are diagnostic tests for aldehydes (ketones negative).',
      },
      {
        name: 'KMnO₄ Oxidative Cleavage (cold vs. hot)',
        reactants: 'Alkene',
        reagents: 'Cold, dilute KMnO₄ (syn dihydroxylation) OR hot, conc. KMnO₄ (cleavage)',
        product: 'Cold: vicinal diol (cis-glycol). Hot: ketones + carboxylic acids',
        note: 'Cold = syn diol formation (like OsO₄). Hot = same as oxidative ozonolysis.',
      },
    ],
  },
  {
    title: 'Amine Reactions',
    reactions: [
      {
        name: 'Reductive Amination',
        reactants: 'Aldehyde or ketone + amine',
        reagents: 'NaBH₃CN (or H₂/Ni), acid catalyst',
        product: 'Amine (R₂CHNH₂ type)',
        mechanism: 'Imine (Schiff base) formed first → then reduced to amine',
        note: 'Most common route to amines from carbonyl compounds.',
      },
      {
        name: 'Gabriel Synthesis',
        reactants: 'Alkyl halide (primary)',
        reagents: 'Potassium phthalimide, then H₂NNH₂ (hydrazine) or H₂O/H⁺',
        product: 'Primary amine (no over-alkylation)',
        note: 'Circumvents polyalkylation problem of direct N-alkylation.',
      },
      {
        name: 'Hofmann Rearrangement',
        reactants: 'Primary amide (RCONH₂)',
        reagents: 'Br₂, NaOH (aq)',
        product: 'Primary amine (RNH₂) — one carbon shorter than starting amide',
        note: 'C–C bond broken; isocyanate intermediate. Product has one fewer carbon than reactant.',
      },
      {
        name: 'Diazotization',
        reactants: 'Primary aromatic amine (ArNH₂)',
        reagents: 'NaNO₂, HCl, 0–5°C',
        product: 'Aryl diazonium salt (ArN₂⁺ Cl⁻)',
        note: 'Diazonium salts: stable only at cold temperatures; versatile synthetic intermediate.',
      },
      {
        name: 'Sandmeyer Reaction',
        reactants: 'Aryl diazonium salt (from diazotization)',
        reagents: 'CuCl → Ar–Cl; CuBr → Ar–Br; CuCN → Ar–CN; KI → Ar–I',
        product: 'Aryl halide or aryl nitrile',
        note: 'Route to aryl halides not easily accessible by direct EAS.',
      },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function OChemReactionsPage() {
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set([GROUPS[0].title])
  )
  const [search, setSearch] = useState('')

  function toggleGroup(title: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(title) ? next.delete(title) : next.add(title)
      return next
    })
  }

  const query = search.toLowerCase().trim()
  const filtered = query
    ? GROUPS.map((g) => ({
        ...g,
        reactions: g.reactions.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.reagents.toLowerCase().includes(query) ||
            r.product.toLowerCase().includes(query) ||
            r.reactants.toLowerCase().includes(query) ||
            (r.note ?? '').toLowerCase().includes(query)
        ),
      })).filter((g) => g.reactions.length > 0)
    : GROUPS

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
          <FlaskConical className="w-5 h-5 text-violet-600" />
          <h1 className="text-2xl font-bold text-slate-900">OChem Reaction Bank</h1>
        </div>
        <p className="text-sm text-slate-500">
          High-yield reactions organized by type. Reagents, products, and mechanisms — everything the DAT tests.
        </p>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reactions, reagents, products…"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white"
        />
      </div>

      {/* Total count */}
      {!query && (
        <p className="text-xs text-slate-400 mb-4">
          {GROUPS.reduce((s, g) => s + g.reactions.length, 0)} reactions across {GROUPS.length} categories
        </p>
      )}
      {query && (
        <p className="text-xs text-slate-400 mb-4">
          {filtered.reduce((s, g) => s + g.reactions.length, 0)} results for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Groups */}
      <div className="space-y-4">
        {filtered.map((group) => {
          const isOpen = query ? true : openGroups.has(group.title)
          return (
            <div key={group.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Group header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors text-left"
              >
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  {group.title}
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-400">
                  {group.reactions.length} reactions
                  <span className={cn('transition-transform text-slate-400 text-base', isOpen ? 'rotate-180' : '')}>▾</span>
                </span>
              </button>

              {/* Reactions */}
              {isOpen && (
                <div className="divide-y divide-slate-100">
                  {group.reactions.map((rxn) => (
                    <div key={rxn.name} className="px-5 py-4 space-y-2.5">
                      <p className="text-sm font-bold text-slate-900">{rxn.name}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reactants</p>
                          <p className="text-sm text-slate-700 leading-snug">{rxn.reactants}</p>
                        </div>
                        <div className="sm:col-span-1">
                          <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">Reagents / Conditions</p>
                          <p className="text-sm text-violet-800 font-medium leading-snug">{rxn.reagents}</p>
                        </div>
                        <div className="sm:col-span-1">
                          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Product(s)</p>
                          <p className="text-sm text-emerald-800 font-medium leading-snug">{rxn.product}</p>
                        </div>
                      </div>

                      {rxn.mechanism && (
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex-shrink-0">Mechanism</span>
                          <p className="text-xs text-slate-500 leading-snug">{rxn.mechanism}</p>
                        </div>
                      )}

                      {rxn.note && (
                        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                          <span className="text-amber-400 flex-shrink-0 text-sm">💡</span>
                          <p className="text-xs text-amber-800 leading-snug">{rxn.note}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
