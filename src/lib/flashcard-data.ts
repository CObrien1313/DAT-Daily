export interface Flashcard {
  id: string
  front: string
  back: string
}

export interface FlashcardDeck {
  id: string
  subject: string
  emoji: string
  description: string
  color: string       // Tailwind bg class for card accent
  cards: Flashcard[]
}

export const FLASHCARD_DECKS: FlashcardDeck[] = [
  // ── General Chemistry ──────────────────────────────────────────────────────
  {
    id: 'gen-chem',
    subject: 'General Chemistry',
    emoji: '⚗️',
    description: 'Gas laws, thermodynamics, equilibrium, electrochemistry',
    color: 'bg-blue-500',
    cards: [
      { id: 'gc-01', front: 'Ideal Gas Law', back: 'PV = nRT\n\nP = pressure (atm), V = volume (L), n = moles, R = 0.0821 L·atm/mol·K, T = temperature (K)' },
      { id: 'gc-02', front: 'Combined Gas Law', back: 'P₁V₁/T₁ = P₂V₂/T₂\n\nUse when amount of gas (n) is constant.' },
      { id: 'gc-03', front: 'Henderson-Hasselbalch Equation', back: 'pH = pKa + log([A⁻]/[HA])\n\nUsed for buffer systems. When [A⁻] = [HA], pH = pKa.' },
      { id: 'gc-04', front: 'Gibbs Free Energy', back: 'ΔG = ΔH − TΔS\n\nΔG < 0 → spontaneous\nΔG = 0 → equilibrium\nΔG > 0 → non-spontaneous' },
      { id: 'gc-05', front: 'Relationship between Ka, Kb, and Kw', back: 'Ka × Kb = Kw = 1×10⁻¹⁴ (at 25°C)\n\nFor a conjugate acid-base pair:\npKa + pKb = 14' },
      { id: 'gc-06', front: 'Nernst Equation', back: 'E = E° − (0.0592/n) × log(Q)  (at 25°C)\n\nn = moles of electrons transferred\nQ = reaction quotient' },
      { id: 'gc-07', front: 'Relationship: ΔG and cell potential', back: 'ΔG° = −nFE°\n\nn = moles e⁻, F = 96,485 C/mol\nPositive E° → negative ΔG° → spontaneous' },
      { id: 'gc-08', front: 'Molarity vs Molality', back: 'Molarity (M) = mol solute / L solution\nMolality (m) = mol solute / kg solvent\n\nMolality used for colligative properties.' },
      { id: 'gc-09', front: 'Boiling Point Elevation & Freezing Point Depression', back: 'ΔTb = Kb · m · i\nΔTf = Kf · m · i\n\ni = van\'t Hoff factor (number of particles)\nElectrolytes: NaCl → i = 2' },
      { id: 'gc-10', front: 'Osmotic Pressure', back: 'π = MRT\n\nM = molarity, R = 0.0821, T = Kelvin\nSame R as ideal gas law.' },
      { id: 'gc-11', front: 'Rate Law', back: 'rate = k[A]ᵐ[B]ⁿ\n\nm, n determined experimentally (not from balanced equation).\nOverall order = m + n' },
      { id: 'gc-12', front: 'Arrhenius Equation', back: 'k = Ae^(−Ea/RT)\n\nEa = activation energy\nHigher T → larger k → faster reaction\nCatalyst → lowers Ea' },
      { id: 'gc-13', front: 'Beer-Lambert Law', back: 'A = εlc\n\nA = absorbance, ε = molar absorptivity\nl = path length (cm), c = concentration (mol/L)' },
      { id: 'gc-14', front: 'OIL RIG', back: 'Oxidation Is Loss (of electrons)\nReduction Is Gain (of electrons)\n\nThe reducing agent is oxidized.\nThe oxidizing agent is reduced.' },
      { id: 'gc-15', front: 'Dilution Formula', back: 'M₁V₁ = M₂V₂\n\nMoles of solute stay constant when diluting.\nAlways use same units for V on both sides.' },
      { id: 'gc-16', front: 'Le Chatelier\'s Principle', back: 'Adding reactant → equilibrium shifts right (→)\nAdding product → equilibrium shifts left (←)\nIncreasing pressure → shifts toward fewer moles of gas\nIncreasing temperature → favors endothermic direction' },
      { id: 'gc-17', front: 'Hydrogen Bonding Elements', back: 'N, O, F\n\nH-bond donor: H attached to N, O, or F\nH-bond acceptor: lone pair on N, O, or F\n\nStrongest intermolecular force (besides ionic).' },
      { id: 'gc-18', front: 'Hess\'s Law', back: 'ΔH_rxn = Σ ΔH_products − Σ ΔH_reactants\n\nEnthalpy is a state function. You can add/reverse reactions to find ΔH of target reaction.' },
      { id: 'gc-19', front: 'Half-life formulas', back: 'First order: t½ = ln(2)/k = 0.693/k\nZero order: t½ = [A]₀/2k\nSecond order: t½ = 1/(k[A]₀)\n\nFirst order is most common on DAT.' },
      { id: 'gc-20', front: 'pKa vs pH: Which form predominates?', back: 'pH < pKa → protonated (acid) form predominates (HA)\npH > pKa → deprotonated (base) form predominates (A⁻)\npH = pKa → 50/50 mixture' },
    ],
  },

  // ── Organic Chemistry ──────────────────────────────────────────────────────
  {
    id: 'orgo',
    subject: 'Organic Chemistry',
    emoji: '🧪',
    description: 'Substitution, elimination, key reactions, stereochemistry',
    color: 'bg-violet-500',
    cards: [
      { id: 'oc-01', front: 'SN2 Reaction Conditions', back: 'Strong nucleophile, polar aprotic solvent, primary substrate\nMechanism: one step, backside attack\nResult: inversion of configuration (Walden inversion)\nOrder: 1° >> 2° >> (3° doesn\'t work)' },
      { id: 'oc-02', front: 'SN1 Reaction Conditions', back: 'Weak nucleophile, polar protic solvent, tertiary substrate\nMechanism: two steps (carbocation intermediate)\nResult: racemization\nOrder: 3° >> 2° >> 1°' },
      { id: 'oc-03', front: 'E2 Reaction Conditions', back: 'Strong, bulky base (e.g., t-BuOK), high temperature\nAnti-periplanar geometry required\nProduct: major alkene follows Zaitsev\'s rule (most substituted)\nBulky base → Hofmann product (least substituted)' },
      { id: 'oc-04', front: 'E1 Reaction Conditions', back: 'Weak base, polar protic solvent, heat, tertiary substrate\nCarbocation intermediate (same as SN1)\nProduct: follows Zaitsev\'s rule\nCompetes with SN1' },
      { id: 'oc-05', front: 'Markovnikov\'s Rule', back: 'H adds to the carbon with more H\'s (more substituted = less H\'s gets the other group)\n"Rich get richer"\nApplies to: HX addition, H₂O addition (acid-catalyzed)\nGives more stable (more substituted) carbocation intermediate' },
      { id: 'oc-06', front: 'Anti-Markovnikov Addition', back: 'Occurs with radical addition (ROOR or hν, HBr)\nBr adds to less substituted carbon\nBr radical is more stable on more substituted → H ends up there\nOnly works with HBr, not HCl or HI' },
      { id: 'oc-07', front: 'Fischer Esterification', back: 'Carboxylic acid + alcohol → ester + H₂O\nCatalyst: H₂SO₄ or HCl (acid catalyst)\nReversible reaction; remove H₂O to drive forward (Le Chatelier)\nConverse: hydrolysis of ester with H₂O/H⁺' },
      { id: 'oc-08', front: 'Grignard Reagent', back: 'RMgX — strong nucleophile and strong base\nAttacks: aldehydes (→ 2° alcohol), ketones (→ 3° alcohol), CO₂ (→ carboxylic acid), esters (→ 3° alcohol), formaldehyde (→ 1° alcohol)\nCannot have acidic H (OH, NH, COOH) in molecule' },
      { id: 'oc-09', front: 'Aldol Condensation', back: 'Two carbonyl compounds react: enolate attacks another carbonyl\nProduct: β-hydroxy carbonyl compound\nCondensation: water loss gives α,β-unsaturated carbonyl\nRequires: base (NaOH) or acid catalyst' },
      { id: 'oc-10', front: 'Diels-Alder Reaction', back: '[4+2] cycloaddition: conjugated diene + dienophile\nDiene must be s-cis conformation\nStereochemistry: syn addition (suprafacial on both)\nElectron-withdrawing groups on dienophile speed reaction\nProduct: cyclohexene derivative' },
      { id: 'oc-11', front: 'Ozonolysis', back: 'Alkene + O₃, then Zn/H₂O → aldehydes & ketones at double bond\nWith H₂O₂: oxidative → carboxylic acids (aldehydes → acids)\nWith Zn/H₂O: reductive → aldehydes stay as aldehydes\nBreaks C=C completely' },
      { id: 'oc-12', front: 'LiAlH₄ vs NaBH₄', back: 'LiAlH₄ (stronger):\n- Reduces: ketones, aldehydes, esters, carboxylic acids, amides\n- Requires anhydrous conditions\nNaBH₄ (weaker):\n- Reduces: ketones and aldehydes ONLY\n- Can use in protic solvents (water/ethanol)' },
      { id: 'oc-13', front: 'R/S Configuration (CIP Rules)', back: '1. Assign priority 1–4 by atomic number\n2. Orient so priority 4 faces away\n3. 1→2→3 clockwise = R\n4. 1→2→3 counterclockwise = S\nIf #4 is toward you, flip R↔S' },
      { id: 'oc-14', front: 'Enantiomers vs Diastereomers', back: 'Enantiomers: non-superimposable mirror images; opposite optical rotation; same physical properties except rotation\nDiastereomers: stereoisomers that are NOT mirror images; different physical & chemical properties; include cis/trans isomers\nMeso: has stereocenters + internal mirror plane → achiral' },
      { id: 'oc-15', front: 'Aromaticity (Hückel\'s Rule)', back: 'Aromatic requires ALL of:\n1. Cyclic\n2. Planar\n3. Fully conjugated (alternating π bonds or lone pairs)\n4. 4n+2 π electrons (n = 0,1,2...)\n\nAromatic: 2,6,10,14 π electrons\nAntiaromatic: 4n π electrons (very unstable)' },
      { id: 'oc-16', front: 'Wittig Reaction', back: 'Ylide (Ph₃P=CR₂) + aldehyde/ketone → alkene + Ph₃P=O\nStereochemistry: cis-alkene from stabilized ylide\nUseful for making alkenes with exact double bond placement' },
      { id: 'oc-17', front: 'Protecting Groups', back: 'Common protecting groups:\n- Alcohol → TMS ether or THP (acetal)\n- Aldehyde → acetal (with ROH/H⁺)\n- Amine → Boc or Cbz\nRemove selectively without affecting rest of molecule' },
      { id: 'oc-18', front: 'IR Spectroscopy Key Peaks', back: '~3300 cm⁻¹: O-H (broad) or N-H\n~2900 cm⁻¹: C-H stretch\n~2200 cm⁻¹: C≡C or C≡N\n~1710 cm⁻¹: C=O (carbonyl)\n~1600 cm⁻¹: C=C aromatic or alkene' },
      { id: 'oc-19', front: 'Nucleophilic Acyl Substitution Order', back: 'Reactivity (most → least reactive):\nAcid chloride > Anhydride > Ester > Amide\n\nLess stable leaving group = more reactive\nCl⁻ is better LG than RO⁻ or NH₂⁻' },
      { id: 'oc-20', front: 'EAS vs NAS on Benzene Ring', back: 'EAS (Electrophilic Aromatic Substitution): benzene + electrophile → substitution\nActivating groups (OH, NH₂, OR): ortho/para directors\nDeactivating groups (NO₂, COOH, CN): meta directors\nHalogens: deactivating but ortho/para directors' },
    ],
  },

  // ── Biology ────────────────────────────────────────────────────────────────
  {
    id: 'biology',
    subject: 'Biology',
    emoji: '🧬',
    description: 'Cell biology, genetics, physiology, biochemistry',
    color: 'bg-emerald-500',
    cards: [
      { id: 'bi-01', front: 'Stages of Mitosis', back: 'PMAT:\nProphase → chromatin condenses, spindle forms\nMetaphase → chromosomes align at metaphase plate\nAnaphase → sister chromatids separate to poles\nTelophase → nuclear envelope reforms, cell divides (cytokinesis)' },
      { id: 'bi-02', front: 'Meiosis I vs Meiosis II', back: 'Meiosis I (reductive division):\n- Homologous chromosomes separate\n- Crossing over occurs in prophase I\nMeiosis II (equational division):\n- Sister chromatids separate\n- Similar to mitosis\nResult: 4 haploid cells with unique combinations' },
      { id: 'bi-03', front: 'DNA Base Pairs and Bond Strength', back: 'A pairs with T: 2 hydrogen bonds\nG pairs with C: 3 hydrogen bonds\n\nG-C pairs → stronger, higher Tm\nRNA: Uracil (U) replaces Thymine (T)\nRNA has A-U pairs (2 H-bonds)' },
      { id: 'bi-04', front: 'Cellular Respiration ATP Yield', back: 'Glycolysis: 2 ATP (net), 2 NADH\nPyruvate oxidation: 2 NADH\nKrebs cycle: 2 ATP, 6 NADH, 2 FADH₂\nETC/oxidative phosphorylation: ~32-34 ATP\nTotal: ~36-38 ATP per glucose\nNADH → ~2.5 ATP; FADH₂ → ~1.5 ATP' },
      { id: 'bi-05', front: 'Hardy-Weinberg Equilibrium', back: 'p² + 2pq + q² = 1\np + q = 1\n\np = frequency of dominant allele\nq = frequency of recessive allele\np² = homozygous dominant\n2pq = heterozygous\nq² = homozygous recessive\n\nRequires: no mutation, migration, selection, genetic drift; random mating' },
      { id: 'bi-06', front: 'Enzyme Kinetics (Michaelis-Menten)', back: 'Km = [S] at ½Vmax\nLow Km → high affinity for substrate\nHigh Km → low affinity\n\nLineweaver-Burk plot:\n- x-intercept = −1/Km\n- y-intercept = 1/Vmax\n- Slope = Km/Vmax' },
      { id: 'bi-07', front: 'Competitive vs Non-competitive Inhibition', back: 'Competitive:\n- ↑ Km (apparent), same Vmax\n- Inhibitor resembles substrate; competes for active site\n- Can overcome with more substrate\nNon-competitive:\n- Same Km, ↓ Vmax\n- Binds allosteric site; changes enzyme shape\n- Cannot overcome with more substrate' },
      { id: 'bi-08', front: 'Mendelian Cross Ratios', back: 'F2 Monohybrid (Aa × Aa):\n- Phenotype: 3:1\n- Genotype: 1:2:1\nDihybrid (AaBb × AaBb):\n- Phenotype: 9:3:3:1\nTestcross (Aa × aa): 1:1\nIncomplete dominance F2: 1:2:1 (phenotype = genotype)' },
      { id: 'bi-09', front: 'Cell Cycle Checkpoints', back: 'G1 checkpoint (restriction point): cell size, nutrients, growth factors\nG2 checkpoint: DNA damage repair complete?\nSpindle checkpoint (metaphase): all chromosomes attached to spindle?\n\nCyclins and CDKs regulate progression.\np53 = tumor suppressor at G1 checkpoint' },
      { id: 'bi-10', front: 'lac Operon', back: 'Inducible operon in E. coli\nNo lactose: repressor binds operator → genes OFF\nLactose present: allolactose binds repressor → repressor off operator → genes ON\nCatabolite repression: glucose present → low cAMP → low transcription even with lactose' },
      { id: 'bi-11', front: 'Types of RNA and Their Functions', back: 'mRNA (messenger): carries genetic code from DNA to ribosome\ntRNA (transfer): brings amino acids to ribosome; anticodon matches codon\nrRNA (ribosomal): structural component of ribosome (most abundant RNA)\nsnRNA: splicing of pre-mRNA (spliceosome)\nmiRNA: gene silencing/regulation' },
      { id: 'bi-12', front: 'Blood Types', back: 'Type A: A antigen, anti-B antibody\nType B: B antigen, anti-A antibody\nType AB: both antigens, no antibodies (universal recipient)\nType O: no antigens, both antibodies (universal donor)\n\nRh factor: Rh+ has D antigen; Rh- lacks it' },
      { id: 'bi-13', front: 'Action Potential Steps', back: '1. Resting potential: −70 mV (K⁺ inside, Na⁺ outside)\n2. Depolarization: Na⁺ channels open → Na⁺ rushes in → membrane reaches ~+40 mV\n3. Repolarization: K⁺ channels open → K⁺ leaves\n4. Hyperpolarization: brief dip below −70 mV\n5. Refractory period: Na⁺ channels inactivated → no new AP' },
      { id: 'bi-14', front: 'Protein Structure Levels', back: '1° Primary: amino acid sequence (peptide bonds)\n2° Secondary: α-helix, β-sheet (H-bonds between backbone)\n3° Tertiary: 3D shape (disulfide bridges, hydrophobic interactions, H-bonds)\n4° Quaternary: multiple polypeptide subunits\n\nDenaturing: disrupts 2°, 3°, 4° but not 1°' },
      { id: 'bi-15', front: 'Kidney Nephron Function', back: 'Glomerulus: filtration (water, ions, glucose, waste)\nProximal tubule: reabsorbs 65% Na⁺, glucose, amino acids\nLoop of Henle: concentration gradient (descending = water out; ascending = Na⁺ out)\nDistal tubule: fine-tuning (ADH, aldosterone)\nCollecting duct: final water reabsorption (ADH-dependent)' },
      { id: 'bi-16', front: 'Viruses vs Bacteria', back: 'Virus:\n- Not a cell; needs host to replicate\n- Contains DNA or RNA (not both)\n- No ribosomes, no metabolism\n- Treated by antivirals\nBacteria:\n- Prokaryote (no nucleus)\n- Has both DNA and RNA\n- Has own ribosomes\n- Treated by antibiotics' },
      { id: 'bi-17', front: 'Photosynthesis Overview', back: 'Light reactions (thylakoid):\n- Water splitting → O₂ produced\n- ATP and NADPH produced\n- Photosystems I and II\nCalvin cycle (stroma):\n- CO₂ fixed → G3P (3-carbon)\n- Uses ATP and NADPH\n- 3 CO₂ → 1 G3P (net)\nOverall: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂' },
      { id: 'bi-18', front: 'Gene Expression Control in Eukaryotes', back: 'Transcriptional: promoters, enhancers, transcription factors\nPost-transcriptional: mRNA capping, polyadenylation, splicing\nTranslational: ribosomes, eIF factors\nPost-translational: phosphorylation, glycosylation, ubiquitin-proteasome\n\nMost regulation occurs at transcription initiation.' },
      { id: 'bi-19', front: 'Immune System: Innate vs Adaptive', back: 'Innate (non-specific, fast):\n- Neutrophils, macrophages, NK cells, complement\n- Recognizes PAMPs via PRRs (Toll-like receptors)\nAdaptive (specific, slow, memory):\n- T cells (cell-mediated), B cells (humoral/antibody)\n- MHC I: presents to cytotoxic T cells (CD8+)\n- MHC II: presents to helper T cells (CD4+)' },
      { id: 'bi-20', front: 'Connective Tissue Types', back: 'Loose (areolar): adipose, surrounds organs\nDense regular: tendons, ligaments\nDense irregular: dermis, organ capsules\nCartilage: hyaline (joints), fibrocartilage (discs), elastic (ear)\nBone: compact (osteons) + spongy (trabeculae)\nBlood: fluid CT (RBC, WBC, platelets in plasma)' },
    ],
  },

  // ── Quantitative Reasoning ─────────────────────────────────────────────────
  {
    id: 'qr',
    subject: 'Quantitative Reasoning',
    emoji: '📐',
    description: 'Geometry, algebra, probability, statistics',
    color: 'bg-rose-500',
    cards: [
      { id: 'qr-01', front: 'Circle Formulas', back: 'Area = πr²\nCircumference = 2πr = πd\nArc length = (θ/360°) × 2πr\nSector area = (θ/360°) × πr²' },
      { id: 'qr-02', front: 'Volume Formulas', back: 'Sphere: V = (4/3)πr³; SA = 4πr²\nCylinder: V = πr²h; SA = 2πr² + 2πrh\nCone: V = (1/3)πr²h\nCube: V = s³; SA = 6s²\nRectangular prism: V = lwh' },
      { id: 'qr-03', front: 'Pythagorean Theorem & Common Triples', back: 'a² + b² = c²  (c = hypotenuse)\n\nCommon triples:\n3-4-5 (and multiples: 6-8-10, 9-12-15)\n5-12-13\n8-15-17\n7-24-25\n\nSpecial triangles:\n30-60-90: sides 1, √3, 2\n45-45-90: sides 1, 1, √2' },
      { id: 'qr-04', front: 'Quadratic Formula', back: 'x = (−b ± √(b²−4ac)) / 2a\n\nFor ax² + bx + c = 0\nDiscriminant = b²−4ac:\n> 0: two real roots\n= 0: one real root\n< 0: no real roots (complex)' },
      { id: 'qr-05', front: 'Combinations and Permutations', back: 'Permutation (order matters):\nP(n,r) = n! / (n−r)!\n\nCombination (order doesn\'t matter):\nC(n,r) = n! / (r!(n−r)!)\n\nFundamental Counting Principle:\nIf A has m ways and B has n ways, A and B together: m × n ways' },
      { id: 'qr-06', front: 'Probability Rules', back: 'P(A or B) = P(A) + P(B) − P(A and B)\nP(A and B) = P(A) × P(B)  [independent events]\nP(A and B) = P(A) × P(B|A)  [dependent]\nP(not A) = 1 − P(A)\nP(A|B) = P(A and B) / P(B)' },
      { id: 'qr-07', front: 'Mean, Median, Mode, Range', back: 'Mean: sum of values / count\nMedian: middle value (sorted); if even n, average the two middle values\nMode: most frequently occurring value\nRange: max − min\n\nStandard deviation: measure of spread around mean' },
      { id: 'qr-08', front: 'Exponent Rules', back: 'aᵐ × aⁿ = aᵐ⁺ⁿ\naᵐ / aⁿ = aᵐ⁻ⁿ\n(aᵐ)ⁿ = aᵐⁿ\n(ab)ⁿ = aⁿbⁿ\na⁰ = 1\na⁻ⁿ = 1/aⁿ\na^(1/n) = ⁿ√a' },
      { id: 'qr-09', front: 'Logarithm Rules', back: 'log(ab) = log(a) + log(b)\nlog(a/b) = log(a) − log(b)\nlog(aⁿ) = n log(a)\nlog_b(b) = 1;  log_b(1) = 0\nln(e) = 1\n\nChange of base: log_b(x) = log(x)/log(b)' },
      { id: 'qr-10', front: 'Interest Formulas', back: 'Simple interest: I = Prt\nA = P(1 + rt)\n\nCompound interest: A = P(1 + r/n)^(nt)\nContinuous: A = Pe^(rt)\n\nP = principal, r = rate, t = time, n = compounds/year' },
      { id: 'qr-11', front: 'Slope and Line Equations', back: 'Slope: m = (y₂−y₁)/(x₂−x₁)\nSlope-intercept: y = mx + b\nPoint-slope: y−y₁ = m(x−x₁)\nStandard: Ax + By = C\n\nParallel lines: equal slopes\nPerpendicular: slopes are negative reciprocals (m₁ × m₂ = −1)' },
      { id: 'qr-12', front: 'Distance and Midpoint', back: 'Distance: d = √((x₂−x₁)² + (y₂−y₁)²)\nMidpoint: M = ((x₁+x₂)/2, (y₁+y₂)/2)\n\nFor 3D distance: d = √((Δx)² + (Δy)² + (Δz)²)' },
      { id: 'qr-13', front: 'Arithmetic & Geometric Sequences', back: 'Arithmetic:\naₙ = a₁ + (n−1)d\nSₙ = n/2 × (a₁ + aₙ) = n/2 × (2a₁ + (n−1)d)\n\nGeometric:\naₙ = a₁ × r^(n−1)\nSₙ = a₁(1−rⁿ)/(1−r)  (r ≠ 1)\nInfinite sum (|r|<1): S = a₁/(1−r)' },
      { id: 'qr-14', front: 'Percent Change and Ratios', back: '% change = (new − old)/old × 100\n\nIf price increases by x%, then decreases by x%,\nnet is a loss (not zero).\nExample: 100 → +50% = 150 → −50% = 75\n\nPart/Whole × 100 = percent' },
      { id: 'qr-15', front: 'Right Triangle Trig (SOH-CAH-TOA)', back: 'sin θ = opposite/hypotenuse\ncos θ = adjacent/hypotenuse\ntan θ = opposite/adjacent = sin/cos\n\nKey values:\nsin 30° = 0.5; cos 30° = √3/2\nsin 45° = cos 45° = √2/2\nsin 60° = √3/2; cos 60° = 0.5' },
      { id: 'qr-16', front: 'Work Rate Problems', back: 'If A completes job in a hours: rate = 1/a\nIf B completes job in b hours: rate = 1/b\nCombined: 1/a + 1/b = 1/t\n\nt = ab/(a+b)\n\nDon\'t add times — add rates!' },
      { id: 'qr-17', front: 'Distance = Rate × Time', back: 'd = rt (also: r = d/t, t = d/r)\n\nRound trip: average speed = 2(r₁×r₂)/(r₁+r₂)  [harmonic mean]\n\nRelative speed:\n- Same direction: |r₁ − r₂|\n- Opposite directions: r₁ + r₂' },
      { id: 'qr-18', front: 'Binomial Theorem', back: '(a+b)² = a² + 2ab + b²\n(a−b)² = a² − 2ab + b²\n(a+b)(a−b) = a² − b²\n(a+b)³ = a³ + 3a²b + 3ab² + b³\n\nPascal\'s triangle gives binomial coefficients.' },
      { id: 'qr-19', front: 'Properties of Inequalities', back: 'Adding/subtracting: inequality direction preserved\nMultiplying/dividing by positive: preserved\nMultiplying/dividing by negative: FLIP the inequality\n\n|x| < a → −a < x < a\n|x| > a → x < −a or x > a' },
      { id: 'qr-20', front: 'Scientific Notation', back: 'n × 10^k where 1 ≤ n < 10\n\nMultiply: multiply coefficients, add exponents\nDivide: divide coefficients, subtract exponents\n\n(2×10³)(3×10⁴) = 6×10⁷\n(6×10⁸)/(2×10³) = 3×10⁵' },
    ],
  },
]
