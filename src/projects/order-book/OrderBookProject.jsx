import { useState, useEffect, useRef, useCallback } from 'react'
import usePyodide from '@/python/usePyodide'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import ProjectLayout from '@/projects/ProjectLayout'
import engineCode from './capacity_engine.py?raw'
import { FALLBACK_BACKLOG, DEFAULT_INPUTS, PRESETS, FALLBACK_RESULT } from './fallbackData'
import DeliveryPresetSelector from './DeliveryPresetSelector'
import CapacityControls from './CapacityControls'
import OrderBookEditor from './OrderBookEditor'
import RevenueTimeline from './RevenueTimeline'
import CapacityGapPanel from './CapacityGapPanel'
import HeadcountRoiPanel from './HeadcountRoiPanel'
import { SOCIAL } from '@/config/constants'

const STATUS_MAP = {
  idle: 'offline',
  loading: 'loading',
  ready: 'live',
  error: 'offline',
}

// Purple is reserved for the Pyodide / intelligence badge only (ETO project, not AI).
const BADGES = [
  { label: 'Python', color: 'green' },
  { label: 'Capacity Queue', color: 'blue' },
  { label: 'Pyodide', color: 'purple' },
  { label: 'Recharts', color: 'orange' },
]

const LIMITATIONS = [
  'A capacity-slot queue, not a full resource/skills scheduler — one project occupies one delivery team; it does not model shared specialists or sub-trades.',
  'Margin is recognised straight-line over each project’s duration (percent-of-completion); many businesses bill on milestones instead.',
  'Revenue realization is a single risk haircut on late and new-order margin; a production model would price each client’s penalty and cancellation terms.',
  'Throughput is the largest value component and rests on a calibrated fill curve (0.55 + 2.5×growth, saturating near 18% growth), not a booked, order-by-order demand forecast.',
  'New intake is modelled as freed-capacity fill at the book’s blended margin, not forecast project by project — so very lumpy or seasonal pipelines need a finer model.',
  'A sensitivity instrument, not a delivery plan or investment advice.',
]

// Split engine code into CodeToggle tabs (same STAGE_MARKER convention as the
// other projects). The three banners map to these three tabs in order.
const STAGE_MARKER = '# ═══════════════════════════════════════════════════════════════'
function splitEngineTabs(code) {
  const sections = code.split(STAGE_MARKER)
  const stages = {}
  const names = ['Build Backlog', 'Schedule Slots', 'Forward Revenue']
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
  'start_i = \\max(\\text{crew free},\\ intake_i),\\quad finish_i = start_i + dur_i',
  'ROI = \\frac{\\Delta PV_{margin}}{Initial + \\sum_{t=1}^{H} c_m/(1+r_m)^{t}} - 1',
  'V_{throughput} = \\Delta crews \\cdot \\bar{m} \\cdot u \\cdot AF(r_m, H) \\cdot p,\\ \\ u = \\min(1,\\ 0.55 + 2.5g)',
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
        A slipped project pushes everything queued behind it in its crew to the right (the cascade a
        linear model can&apos;t express). The crew ROI present-values the freed margin and recurring
        crew cost at your monthly hurdle rate <em>r<sub>m</sub></em>; late and new-order margin are
        haircut by your realization rate <em>p</em>.
      </p>
    </div>
  )
}

function toPayload(inputs, backlog) {
  // The order book ships embedded in the payload (engine is pure-stdlib, no CSV mount).
  // Extra backlog keys (customer, segment, status) are ignored by the engine.
  return { ...inputs, backlog }
}

function cloneBook(book) {
  return book.map((p) => ({ ...p }))
}

export default function OrderBookProject() {
  const { status, runPython } = usePyodide()
  const [inputs, setInputs] = useState(() => ({ ...DEFAULT_INPUTS }))
  const [backlog, setBacklog] = useState(() => cloneBook(FALLBACK_BACKLOG))
  const [result, setResult] = useState(FALLBACK_RESULT)
  const [activePresetId, setActivePresetId] = useState('manufacturer')
  const nextIdRef = useRef(1)
  const [flashKey, setFlashKey] = useState(0)
  const [engineError, setEngineError] = useState(false)
  const reqRef = useRef(0)
  const lastRunRef = useRef(0)
  const trailingRef = useRef(null)
  const flashRef = useRef(null)

  // Live recompute, throttled (~60ms) so the cards and curve track the sliders as
  // you drag — still 100% real Python. Out-of-order worker results are dropped via a
  // request id, the prior result stays visible (never blank), and the value flashes
  // once on settle. Lifted verbatim from the AI Value Model.
  useEffect(() => {
    if (status !== 'ready') return

    const compute = () => {
      lastRunRef.current = performance.now()
      const myId = ++reqRef.current
      runPython(engineCode, {
        params: { eto_inputs_json: JSON.stringify(toPayload(inputs, backlog)) },
      })
        .then((res) => {
          if (res && myId === reqRef.current) {
            setResult(res)
            setEngineError(false)
          }
        })
        .catch((err) => {
          console.error('Capacity engine failed:', err)
          setEngineError(true)
        })
    }

    const THROTTLE_MS = 60
    const sinceLast = performance.now() - lastRunRef.current
    clearTimeout(trailingRef.current)
    if (sinceLast >= THROTTLE_MS) compute()
    else trailingRef.current = setTimeout(compute, THROTTLE_MS - sinceLast)

    clearTimeout(flashRef.current)
    flashRef.current = setTimeout(() => setFlashKey((k) => k + 1), 260)

    return () => {
      clearTimeout(trailingRef.current)
      clearTimeout(flashRef.current)
    }
  }, [status, inputs, backlog, runPython])

  // Editing a lever or the book means the user has left the preset — no card highlighted.
  const onFieldChange = useCallback((field, val) => {
    setActivePresetId(null)
    setInputs((prev) => ({ ...prev, [field]: val }))
  }, [])

  const onProjectChange = useCallback((index, field, val) => {
    setActivePresetId(null)
    setBacklog((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: val } : p)))
  }, [])

  const onAddProject = useCallback(() => {
    setActivePresetId(null)
    setBacklog((prev) => [
      ...prev,
      {
        id: `NEW-${nextIdRef.current++}`,
        name: 'New project',
        contract_value: 50_000,
        gross_margin_pct: 0.3,
        duration_months: 3,
        order_intake_date: '2026-01',
        promised_delivery_date: '2026-06',
        priority: 2,
      },
    ])
  }, [])

  const onDeleteProject = useCallback((index) => {
    setActivePresetId(null)
    setBacklog((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const onSelectPreset = useCallback((id) => {
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    setActivePresetId(id)
    setInputs({ ...preset.inputs })
    setBacklog(cloneBook(preset.backlog))
    // Seed the preset's precomputed result instantly (offline-correct); the live
    // engine refines it to identical numbers once Pyodide is ready.
    if (preset.result) {
      setResult(preset.result)
      setEngineError(false)
    }
  }, [])

  const onReset = useCallback(() => {
    setActivePresetId('manufacturer')
    setInputs({ ...DEFAULT_INPUTS })
    setBacklog(cloneBook(FALLBACK_BACKLOG))
    // Re-seed the default result instantly (offline-correct) so reset matches preset
    // selection — FALLBACK_RESULT is the engine output at the default book + inputs.
    setResult(FALLBACK_RESULT)
    setEngineError(false)
  }, [])

  return (
    <ProjectLayout
      id="order-book"
      number={4}
      title="Order Book Forecaster"
      subtitle="Your backlog is your forward revenue"
      question="Where can we invest in people to capture demand during a period of growth? If a project slips, when does the next one start — and what does that do to recognised revenue over the next 12–18 months? Works for any project-based business — fabricator, services firm, or manufacturer — at your own scale."
      badges={BADGES}
      pyodideStatus={STATUS_MAP[status] || 'offline'}
      codeByTab={ENGINE_TABS}
      limitations={LIMITATIONS}
      formulas={<RoiFormulas />}
    >
      <DeliveryPresetSelector presets={PRESETS} activeId={activePresetId} onSelect={onSelectPreset} />
      <OrderBookEditor
        backlog={backlog}
        onProjectChange={onProjectChange}
        onAddProject={onAddProject}
        onDeleteProject={onDeleteProject}
      />
      <CapacityControls
        inputs={inputs}
        onFieldChange={onFieldChange}
        onReset={onReset}
        pyodideReady={status === 'ready'}
      />

      {(status === 'error' || engineError) && (
        <div className="mt-4 rounded-lg border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-secondary">
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

      <div className="mt-6 flex flex-col gap-6">
        <RevenueTimeline timeline={result.timeline} />
        <HeadcountRoiPanel result={result} flashKey={flashKey} />
        <CapacityGapPanel capacityGap={result.capacity_gap} teams={inputs.delivery_teams} />
      </div>
    </ProjectLayout>
  )
}
