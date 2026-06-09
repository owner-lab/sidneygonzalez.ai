import { useState, useEffect, useRef, useCallback } from 'react'
import ProjectLayout from '@/projects/ProjectLayout'
import usePyodide from '@/python/usePyodide'
import GlassPanel from '@/components/ui/GlassPanel'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import engineCode from './ai_roi_engine.py?raw'
import { BENEFIT_PARAMS, DEFAULT_INPUTS, FALLBACK_RESULT } from './fallbackData'
import RoiInputsPanel from './RoiInputsPanel'
import RoiResults from './RoiResults'
import IdcCredibilityPanel from './IdcCredibilityPanel'

const STATUS_MAP = {
  idle: 'offline',
  loading: 'loading',
  ready: 'live',
  error: 'offline',
}

const BADGES = [
  { label: 'Python', color: 'green' },
  { label: 'IDC Framework', color: 'blue' },
  { label: 'Pyodide', color: 'purple' },
  { label: 'Sensitivity Analysis', color: 'orange' },
]

const LIMITATIONS = [
  'A sensitivity model, not a forecast — outputs are only as sound as the value and cost assumptions you enter.',
  "The closed-form equation shown is our implementation of IDC's redefined ROI, not a verbatim IDC formula.",
  'Success probability is a single risk multiplier; a production model would decompose it per benefit and per year.',
  'Value is treated as flat annual recurring × horizon — no ramp curve, discounting, or NPV.',
  'Illustrative defaults; not investment advice.',
]

// Split engine code into CodeToggle tabs (same STAGE_MARKER convention as the
// other projects).
const STAGE_MARKER = '# ═══════════════════════════════════════════════════════════════'
function splitEngineTabs(code) {
  const sections = code.split(STAGE_MARKER)
  const stages = {}
  const names = ['Parse Inputs', 'Apply IDC Formula', 'Break-Even & Sensitivity']
  let nameIdx = 0

  for (let i = 0; i < sections.length; i++) {
    if (sections[i].includes('STAGE') && nameIdx < names.length) {
      const stageHeader = sections[i].trim()
      const stageCode = i + 1 < sections.length ? sections[i + 1].trim() : ''
      stages[names[nameIdx]] = stageHeader + '\n\n' + stageCode
      nameIdx++
      i++
    }
  }

  if (nameIdx === 0) return { 'Full Code': code }
  return stages
}

const ENGINE_TABS = splitEngineTabs(engineCode)

const FORMULAS = [
  'AI\\ Value\\ Income = \\sum_{t=1}^{Y}\\sum_{i=1}^{9}(Direct_i + Indirect_i)',
  'Risk\\text{-}adj\\ ROI = \\frac{AI\\ Value\\ Income}{Initial + Annual \\times Y} \\times P_{success}',
  'Break\\text{-}even\\ P^{*} = \\frac{Initial + Annual \\times Y}{AI\\ Value\\ Income}',
]

function RoiFormulas() {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = FORMULAS.map(
      (f) =>
        `<span class="mx-3">${katex.renderToString(f, { displayMode: false, throwOnError: false })}</span>`
    ).join('')
  }, [])

  return (
    <div>
      <div
        ref={ref}
        data-lenis-prevent
        className="flex flex-wrap items-center gap-2 overflow-x-auto rounded-lg bg-bg-surface/50 px-3 py-3 text-xs text-text-secondary sm:px-4 sm:text-sm"
      />
      <p className="mt-2 text-[11px] text-text-muted">
        Our implementation of IDC&apos;s redefined AI ROI (IDC FutureScape 2026, &ldquo;Measure or
        Miss: The AI Value Test&rdquo;). ROI&nbsp;% is expressed as (multiple&nbsp;&minus;&nbsp;1).
      </p>
    </div>
  )
}

function cloneInputs(src) {
  return { ...src, benefits: { ...src.benefits } }
}

function toPayload(inputs) {
  return {
    benefits: BENEFIT_PARAMS.map((b) => ({
      id: b.id,
      name: b.name,
      annual_value: inputs.benefits[b.id] ?? 0,
    })),
    direct_ratio: inputs.direct_ratio,
    initial_cost: inputs.initial_cost,
    annual_cost: inputs.annual_cost,
    success_probability: inputs.success_probability,
    years: inputs.years,
  }
}

export default function AiRoiProject() {
  const { status, runPython } = usePyodide()
  const [inputs, setInputs] = useState(() => cloneInputs(DEFAULT_INPUTS))
  const [result, setResult] = useState(FALLBACK_RESULT)
  const [flashKey, setFlashKey] = useState(0)
  const reqRef = useRef(0)
  const lastRunRef = useRef(0)
  const trailingRef = useRef(null)
  const flashRef = useRef(null)

  // Live recompute, throttled (~60ms) so the result cards track the sliders as
  // you drag — still 100% real Python, just rate-limited. Out-of-order worker
  // results are dropped via a request id, the prior result stays visible (no
  // skeleton flicker), and the value flashes once on settle, not on every tick.
  useEffect(() => {
    if (status !== 'ready') return

    const compute = () => {
      lastRunRef.current = performance.now()
      const myId = ++reqRef.current
      runPython(engineCode, {
        params: { inputs_json: JSON.stringify(toPayload(inputs)) },
      })
        .then((res) => {
          if (res && myId === reqRef.current) setResult(res)
        })
        .catch((err) => console.error('AI ROI engine failed:', err))
    }

    const THROTTLE_MS = 60
    const sinceLast = performance.now() - lastRunRef.current
    clearTimeout(trailingRef.current)
    if (sinceLast >= THROTTLE_MS) compute()
    else trailingRef.current = setTimeout(compute, THROTTLE_MS - sinceLast)

    // One flash once the interaction settles (avoids strobing during a drag).
    clearTimeout(flashRef.current)
    flashRef.current = setTimeout(() => setFlashKey((k) => k + 1), 260)

    return () => {
      clearTimeout(trailingRef.current)
      clearTimeout(flashRef.current)
    }
  }, [status, inputs, runPython])

  const onBenefitChange = useCallback((id, val) => {
    setInputs((prev) => ({ ...prev, benefits: { ...prev.benefits, [id]: val } }))
  }, [])

  const onFieldChange = useCallback((field, val) => {
    setInputs((prev) => ({ ...prev, [field]: val }))
  }, [])

  const onApplyPreset = useCallback((presetInputs) => {
    setInputs(cloneInputs(presetInputs))
  }, [])

  const onReset = useCallback(() => {
    setInputs(cloneInputs(DEFAULT_INPUTS))
  }, [])

  return (
    <ProjectLayout
      id="ai-roi"
      number={4}
      title="AI Business Value Model"
      subtitle="Risk-Adjusted ROI on IDC's FutureScape 2026 Framework"
      question="If we scale agentic AI, what's the return — and how confident can we be in it? IDC's redefined ROI says the answer isn't the value you hope for; it's that value times the odds you actually ship it. So: what's the risk-adjusted return, what ship-probability would it take just to break even, and which single assumption is the whole case riding on?"
      badges={BADGES}
      pyodideStatus={STATUS_MAP[status] || 'offline'}
      codeByTab={ENGINE_TABS}
      limitations={LIMITATIONS}
      formulas={<RoiFormulas />}
    >
      <GlassPanel className="border border-accent-blue/20">
        <p className="text-sm leading-relaxed text-text-secondary">
          <span className="font-semibold text-text-primary">How to read this: </span>
          you supply the value and cost assumptions; this applies IDC&apos;s risk-adjusted ROI
          formula and shows which assumptions actually move the result. It&apos;s a sensitivity
          model, not a prediction — every figure below is computed live, in your browser, from
          your inputs (open <span className="font-medium text-text-primary">View Code</span> to
          watch the Python execute). Not investment advice.
        </p>
      </GlassPanel>

      <RoiInputsPanel
        inputs={inputs}
        onBenefitChange={onBenefitChange}
        onFieldChange={onFieldChange}
        onApplyPreset={onApplyPreset}
        onReset={onReset}
        pyodideReady={status === 'ready'}
      />

      <RoiResults result={result} flashKey={flashKey} />

      <IdcCredibilityPanel />
    </ProjectLayout>
  )
}
