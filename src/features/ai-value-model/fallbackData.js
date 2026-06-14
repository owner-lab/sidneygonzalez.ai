/**
 * AI Business Value Model — reference data.
 *
 * The nine benefit parameters are IDC's "AI Business Value Benefit" framework
 * (IDC FutureScape 2026, "Measure or Miss: The AI Value Test"). Default dollar
 * figures are ILLUSTRATIVE starting points for a mid-size enterprise case — they
 * are user-editable and are not a forecast or a synthetic dataset.
 *
 * FALLBACK_RESULT mirrors ai_roi_engine.py for DEFAULT_INPUTS so the tool renders
 * a complete result before/without the Pyodide runtime (never-blank contract).
 */

// IDC's nine AI Business Value Benefit parameters (Direct + Indirect each).
export const BENEFIT_PARAMS = [
  {
    id: 'revenue_generation',
    name: 'Revenue Generation',
    tag: 'GROW',
    accent: 'green',
    hint: 'Direct: new AI-driven revenue lines. Indirect: cross-sell / retention lift.',
  },
  {
    id: 'customer_experience',
    name: 'Customer Experience',
    tag: 'CX',
    accent: 'blue',
    hint: 'Direct: deflected service cost. Indirect: NPS-driven lifetime value.',
  },
  {
    id: 'employee_experience',
    name: 'Employee Experience',
    tag: 'EX',
    accent: 'blue',
    hint: 'Direct: retention / hiring savings. Indirect: engagement and capacity.',
  },
  {
    id: 'productivity_efficiency',
    name: 'Productivity & Efficiency',
    tag: 'OPS',
    accent: 'green',
    hint: 'Direct: hours automated × loaded cost. Indirect: rework / error reduction.',
  },
  {
    id: 'innovation',
    name: 'Innovation',
    tag: 'R&D',
    accent: 'purple',
    hint: 'Direct: new products shipped. Indirect: experimentation velocity.',
  },
  {
    id: 'sustainability',
    name: 'Sustainability',
    tag: 'ESG',
    accent: 'green',
    hint: 'Direct: energy / waste savings. Indirect: compliance and brand value.',
  },
  {
    id: 'time_to_market',
    name: 'Time to Market',
    tag: 'SPEED',
    accent: 'orange',
    hint: 'Direct: earlier revenue capture. Indirect: competitive positioning.',
  },
  {
    id: 'security_trust',
    name: 'Security & Trust',
    tag: 'RISK',
    accent: 'red',
    hint: 'Direct: avoided incident / fraud loss. Indirect: customer trust retained.',
  },
  {
    id: 'business_resilience',
    name: 'Business Resilience',
    tag: 'RESIL',
    accent: 'purple',
    hint: 'Direct: downtime avoided. Indirect: supply-chain / demand adaptability.',
  },
]

// Default annual value ($) per benefit — illustrative mid-size enterprise.
export const DEFAULT_BENEFIT_VALUES = {
  revenue_generation: 1_800_000,
  customer_experience: 900_000,
  employee_experience: 500_000,
  productivity_efficiency: 2_500_000,
  innovation: 700_000,
  sustainability: 300_000,
  time_to_market: 800_000,
  security_trust: 600_000,
  business_resilience: 700_000,
}

export const DEFAULT_INPUTS = {
  benefits: { ...DEFAULT_BENEFIT_VALUES },
  direct_ratio: 0.6, // 60% Direct / 40% Indirect
  initial_cost: 2_000_000,
  annual_cost: 800_000,
  success_probability: 0.6, // your assumption — odds the value is actually realized
  years: 3,
  discount_rate: 0.1, // hurdle rate / WACC for NPV — value & cost shown present-valued
}

// Bulk-set presets (success_probability stored 0..1, direct_ratio 0..1).
export const PRESETS = [
  {
    id: 'pilot',
    label: 'Conservative Pilot',
    description: 'Single use-case, tight budget, sceptical ship odds',
    inputs: {
      benefits: {
        revenue_generation: 300_000,
        customer_experience: 350_000,
        employee_experience: 200_000,
        productivity_efficiency: 900_000,
        innovation: 150_000,
        sustainability: 80_000,
        time_to_market: 250_000,
        security_trust: 200_000,
        business_resilience: 180_000,
      },
      direct_ratio: 0.7,
      initial_cost: 600_000,
      annual_cost: 300_000,
      success_probability: 0.4,
      years: 2,
      discount_rate: 0.08,
    },
  },
  {
    id: 'scaling',
    label: 'Scaling Enterprise',
    description: 'Several use-cases in production, governed rollout',
    inputs: {
      benefits: { ...DEFAULT_BENEFIT_VALUES },
      direct_ratio: 0.6,
      initial_cost: 2_000_000,
      annual_cost: 800_000,
      success_probability: 0.6,
      years: 3,
      discount_rate: 0.1,
    },
  },
  {
    id: 'transformation',
    label: 'Aggressive Transformation',
    description: 'Enterprise-wide agentic AI, high upside and high risk',
    inputs: {
      benefits: {
        revenue_generation: 6_000_000,
        customer_experience: 2_800_000,
        employee_experience: 1_500_000,
        productivity_efficiency: 7_500_000,
        innovation: 3_000_000,
        sustainability: 900_000,
        time_to_market: 2_600_000,
        security_trust: 1_800_000,
        business_resilience: 2_400_000,
      },
      direct_ratio: 0.55,
      initial_cost: 9_000_000,
      annual_cost: 3_200_000,
      success_probability: 0.5,
      years: 5,
      discount_rate: 0.1,
    },
  },
]

// Precomputed result for DEFAULT_INPUTS (mirrors ai_roi_engine.py).
export const FALLBACK_RESULT = {
  annual_value_income: 8_800_000,
  value_income: 21_884_297.52,
  total_cost: 3_989_481.59,
  initial_cost: 2_000_000,
  annual_cost: 800_000,
  years: 3,
  discount_rate: 0.1,
  success_probability: 0.6,
  cost_valid: true,
  raw_multiple: 5.485,
  risk_adjusted_multiple: 3.291,
  roi_pct: 229.1,
  net_value: 9_141_096.92,
  break_even_probability: 0.1823,
  break_even_feasible: true,
  payback_years: 0.45,
  per_benefit: [
    { id: 'productivity_efficiency', name: 'Productivity & Efficiency', annual_value: 2_500_000, direct: 1_500_000, indirect: 1_000_000, share_pct: 28.4 },
    { id: 'revenue_generation', name: 'Revenue Generation', annual_value: 1_800_000, direct: 1_080_000, indirect: 720_000, share_pct: 20.5 },
    { id: 'customer_experience', name: 'Customer Experience', annual_value: 900_000, direct: 540_000, indirect: 360_000, share_pct: 10.2 },
    { id: 'time_to_market', name: 'Time to Market', annual_value: 800_000, direct: 480_000, indirect: 320_000, share_pct: 9.1 },
    { id: 'innovation', name: 'Innovation', annual_value: 700_000, direct: 420_000, indirect: 280_000, share_pct: 8.0 },
    { id: 'business_resilience', name: 'Business Resilience', annual_value: 700_000, direct: 420_000, indirect: 280_000, share_pct: 8.0 },
    { id: 'security_trust', name: 'Security & Trust', annual_value: 600_000, direct: 360_000, indirect: 240_000, share_pct: 6.8 },
    { id: 'employee_experience', name: 'Employee Experience', annual_value: 500_000, direct: 300_000, indirect: 200_000, share_pct: 5.7 },
    { id: 'sustainability', name: 'Sustainability', annual_value: 300_000, direct: 180_000, indirect: 120_000, share_pct: 3.4 },
  ],
  sensitivity: [
    { factor: 'AI value income', low: 163.3, high: 295.0, swing: 131.7 },
    { factor: 'Success probability', low: 174.3, high: 284.0, swing: 109.7 },
    { factor: 'Time horizon', low: 170.4, high: 269.0, swing: 98.5 },
    { factor: 'Initial cost', low: 199.1, high: 265.8, swing: 66.7 },
    { factor: 'Annual cost', low: 199.3, high: 265.6, swing: 66.3 },
  ],
}

// Industry-analyst context shown beside the model. These are FORWARD-LOOKING
// predictions (not proven outcomes), each cited to its own distinct claim with
// the source's exact region/timeframe qualifier preserved verbatim. IDC stats
// are sourced to the publicly published FutureScape 2026 APJ excerpt; the
// Gartner stat to its press release. URLs checked live June 2026.
const IDC_DECK_URL =
  'https://info.idc.com/rs/081-ATC-910/images/IDC-futurescape-2026-charting-the-agentic-future-excerpt-AP.pdf'
const GARTNER_URL =
  'https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027'

export const CREDIBILITY_STATS = [
  {
    stat: '66%',
    claim: 'of APJ CEOs believe AI will offer a chance to reinvent their business models within 3–5 years.',
    source: 'IDC FutureScape 2026 (APJ)',
    url: IDC_DECK_URL,
    accent: 'blue',
  },
  {
    stat: '50%',
    claim: 'of AI apps/services will fail to progress beyond proof-of-concept by 2027 (APJ).',
    source: 'IDC FutureScape 2026 (APJ)',
    url: IDC_DECK_URL,
    accent: 'red',
  },
  {
    stat: '+15%',
    claim: 'operating margin by 2029 for organizations that measure human–AI collaboration, vs. chasing AI productivity alone (APJ).',
    source: 'IDC FutureScape 2026 (APJ)',
    url: IDC_DECK_URL,
    accent: 'green',
  },
  {
    stat: '50%',
    claim: 'of new economic value in APJ by 2030 will come from companies scaling their AI capabilities today.',
    source: 'IDC FutureScape 2026 (APJ)',
    url: IDC_DECK_URL,
    accent: 'purple',
  },
  {
    stat: '40%+',
    claim: 'of agentic AI projects will be canceled by end of 2027 — escalating cost, unclear value, weak risk controls.',
    source: 'Gartner (Jun 2025)',
    url: GARTNER_URL,
    accent: 'orange',
  },
]
