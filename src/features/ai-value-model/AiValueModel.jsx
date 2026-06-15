import { useState, useEffect, useRef, useCallback } from 'react'
import usePyodide from '@/python/usePyodide'
import GlassPanel from '@/components/ui/GlassPanel'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import CodeToggle from '@/components/ui/CodeToggle'
import PyodideStatus from '@/components/ui/PyodideStatus'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import engineCode from './ai_roi_engine.py?raw'
import { BENEFIT_PARAMS, DEFAULT_INPUTS, FALLBACK_RESULT } from './fallbackData'
import RoiInputsPanel from './RoiInputsPanel'
import RoiResults from './RoiResults'
import IdcCredibilityPanel from './IdcCredibilityPanel'
import { SOCIAL } from '@/config/constants'

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
  'Value is flat annual recurring with no ramp curve; discounting to NPV is applied at the rate you set (0% = nominal).',
  'Payback is simple time-to-recover on the initial outlay — undiscounted, even when a discount rate is set.',
  'Illustrative defaults; not investment advice.',
]

// variant drives the framing accent only — the data panels keep their semantic
// colors (blue/green/red carry financial meaning). /ai uses the luminous purple.
const VARIANTS = {
  luminous: { ink: 'text-accent-ink-purple', border: 'border-accent-purple/20' },
  default: { ink: 'text-accent-ink-blue', border: 'border-accent-blue/20' },
}

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
  'AI\\ Value\\ Income = \\sum_{t=1}^{Y}\\frac{\\sum_{i=1}^{9}(Direct_i + Indirect_i)}{(1+r)^{t}}',
  'Risk\\text{-}adj\\ ROI = \\frac{AI\\ Value\\ Income}{Initial + \\sum_{t=1}^{Y} Annual/(1+r)^{t}} \\times P_{success}',
  'Break\\text{-}even\\ P^{*} = \\frac{Initial + PV(Annual)}{AI\\ Value\\ Income}',
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
        Miss: The AI Value Test&rdquo;). Value and recurring cost are present-valued at your
        discount rate <em>r</em> (<em>r</em>&nbsp;=&nbsp;0 &rarr; nominal); ROI&nbsp;% is expressed
        as (multiple&nbsp;&minus;&nbsp;1).
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
    discount_rate: inputs.discount_rate ?? 0,
  }
}

/**
 * The live AI Business Value Model, decoupled from the numbered-project scroll
 * layout so it can be embedded as evidence inside the /ai manifesto. It owns
 * the recompute brain and reproduces the View-Code + Known-Limitations closing
 * card that ProjectLayout used to provide.
 */
export default function AiValueModel({
  variant = 'luminous',
  showCredibility = true,
}) {
  const v = VARIANTS[variant] || VARIANTS.default
  const { status, runPython } = usePyodide()
  const [inputs, setInputs] = useState(() => cloneInputs(DEFAULT_INPUTS))
  const [result, setResult] = useState(FALLBACK_RESULT)
  const [flashKey, setFlashKey] = useState(0)
  const [codeOpen, setCodeOpen] = useState(false)
  const [engineError, setEngineError] = useState(false)
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
          if (res && myId === reqRef.current) {
            setResult(res)
            setEngineError(false)
          }
        })
        .catch((err) => {
          console.error('AI ROI engine failed:', err)
          setEngineError(true)
        })
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
    <div>
      {/* Tech badges + live Pyodide status */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {BADGES.map((badge) => (
          <Badge key={badge.label} color={badge.color}>
            {badge.label}
          </Badge>
        ))}
        <div className="ml-auto">
          <PyodideStatus status={STATUS_MAP[status] || 'offline'} />
        </div>
      </div>

      <GlassPanel className={`border ${v.border}`}>
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

      {(status === 'error' || engineError) && (
        <div className="mb-4 rounded-lg border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-secondary">
          Live engine unavailable — the figures below are a static example and the sliders are
          inactive.{' '}
          <a
            href={SOCIAL.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-ink-blue hover:underline"
          >
            View source on GitHub
          </a>
        </div>
      )}

      <RoiResults result={result} flashKey={flashKey} />

      <div className="mt-8">
        <RoiFormulas />
      </div>

      {showCredibility && <IdcCredibilityPanel />}

      {/* Closing card — View Code + Known Limitations */}
      <GlassPanel className="mt-10">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <svg
                className={`h-4 w-4 shrink-0 ${v.ink}`}
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <line
                  x1="8"
                  y1="7"
                  x2="8"
                  y2="11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="4.75" r="0.85" fill="currentColor" />
              </svg>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                Known Limitations
              </h4>
            </div>
            <p className="text-xs text-text-muted">
              What would change if this were deployed for real users.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setCodeOpen(true)}>
            View Code
          </Button>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {LIMITATIONS.map((item, i) => (
            <li
              key={i}
              className="flex gap-2 text-sm leading-relaxed text-text-secondary"
            >
              <span className={`shrink-0 ${v.ink}`} aria-hidden="true">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </GlassPanel>

      {/* Code slide-out (self-manages Lenis stop/start) */}
      <CodeToggle
        isOpen={codeOpen}
        onClose={() => setCodeOpen(false)}
        codeByTab={ENGINE_TABS}
      />
    </div>
  )
}
