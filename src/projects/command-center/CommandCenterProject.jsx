import { useState, useEffect, useMemo, useRef } from 'react'
import ProjectLayout from '@/projects/ProjectLayout'
import usePyodide from '@/python/usePyodide'
import { FALLBACK_DATA } from './fallbackData'
import pipelineCode from './pipeline_etl.py?raw'

import DashboardControls from './DashboardControls'
import ExecutiveSummary from './ExecutiveSummary'
import DivisionalPnL from './DivisionalPnL'
import CashFlowWaterfall from './CashFlowWaterfall'
import WorkingCapitalHealth from './WorkingCapitalHealth'
import RawDataViewer from './RawDataViewer'

const STATUS_MAP = {
  idle: 'offline',
  loading: 'loading',
  ready: 'live',
  error: 'offline',
}

const CSV_FILES = [
  'corporate_pnl_raw.csv',
  'corporate_cashflow_raw.csv',
  'corporate_working_capital_raw.csv',
]

// Split pipeline into 5 tabs for CodeToggle display
const STAGE_MARKER = '# ═══════════════════════════════════════════════════════════════'
function splitPipelineTabs(code) {
  const sections = code.split(STAGE_MARKER)
  const stages = {}
  const names = ['Ingest', 'Validate', 'Clean', 'Transform', 'Output']
  let nameIdx = 0

  for (let i = 0; i < sections.length; i++) {
    if (sections[i].includes('STAGE') && nameIdx < names.length) {
      const stageHeader = sections[i].trim()
      const stageCode = i + 1 < sections.length ? sections[i + 1].trim() : ''
      stages[names[nameIdx]] = stageHeader + '\n\n' + stageCode
      nameIdx++
      i++ // skip the code section — already consumed above
    }
  }

  if (nameIdx === 0) return { Ingest: code }
  return stages
}

const PIPELINE_TABS = splitPipelineTabs(pipelineCode)

const BADGES = [
  { label: 'Python', color: 'green' },
  { label: 'Pandas', color: 'blue' },
  { label: 'Pyodide', color: 'purple' },
  { label: 'Recharts', color: 'orange' },
]

const LIMITATIONS = [
  'Synthetic data lacks the irregularity of real GL exports',
  'No real-time data connection — demonstrates the pipeline pattern',
  'Simplified chart of accounts — real structures have hundreds of GL codes',
  'No user authentication or role-based views',
]

export default function CommandCenterProject() {
  const { status, runPython } = usePyodide()
  const [fullData, setFullData] = useState(FALLBACK_DATA)
  const [isLive, setIsLive] = useState(false)
  const [division, setDivision] = useState('All')
  const [period, setPeriod] = useState(24)
  const [showRawData, setShowRawData] = useState(false)
  const flashRef = useRef(null)

  // Run pipeline when Pyodide is ready
  useEffect(() => {
    if (status !== 'ready' || isLive) return

    let cancelled = false

    async function run() {
      try {
        const result = await runPython(pipelineCode, { csvFiles: CSV_FILES })
        if (!cancelled && result) {
          setFullData(result)
          setIsLive(true)
          // Trigger data-flash animation
          if (flashRef.current) {
            flashRef.current.classList.add('data-flash')
            setTimeout(() => flashRef.current?.classList.remove('data-flash'), 600)
          }
        }
      } catch (err) {
        console.error('Pipeline failed:', err)
        // Keep fallback data visible
      }
    }

    run()
    return () => { cancelled = true }
  }, [status, isLive, runPython])

  // Client-side filtering — no Pyodide re-run
  const filteredPnL = useMemo(() => {
    if (!fullData.pnl_by_division) return []
    let data = fullData.pnl_by_division
    if (period < 24) {
      data = data.slice(-period)
    }
    return data
  }, [fullData, period])

  const filteredWC = useMemo(() => {
    if (!fullData.working_capital) return []
    let data = fullData.working_capital
    if (period < 24) {
      data = data.slice(-period)
    }
    return data
  }, [fullData, period])

  // Recompute summary for selected division + period
  const filteredSummary = useMemo(() => {
    if (!fullData.div_detail || division === 'All') {
      // Company-wide: use precomputed summary, adjust for period
      const s = fullData.summary
      if (period === 24) return s
      return {
        ...s,
        revenue_sparkline: s.revenue_sparkline?.slice(-period),
        ebitda_sparkline: s.ebitda_sparkline?.slice(-period),
        fcf_sparkline: s.fcf_sparkline?.slice(-period),
        ccc_sparkline: s.ccc_sparkline?.slice(-period),
      }
    }

    // Per-division: recompute from div_detail
    let detail = fullData.div_detail
    if (period < 24) detail = detail.slice(-period)

    const revKey = `${division}_revenue`
    const ebitdaKey = `${division}_ebitda`

    const revs = detail.map((r) => r[revKey] || 0)
    const ebitdas = detail.map((r) => r[ebitdaKey] || 0)
    const totalRev = revs.reduce((a, b) => a + b, 0)
    const totalEbitda = ebitdas.reduce((a, b) => a + b, 0)

    return {
      total_revenue: totalRev,
      ebitda: totalEbitda,
      ebitda_margin: totalRev ? Math.round((totalEbitda / totalRev) * 1000) / 10 : 0,
      free_cash_flow: fullData.summary.free_cash_flow, // FCF is company-wide
      ccc: fullData.summary.ccc,
      revenue_sparkline: revs,
      ebitda_sparkline: ebitdas,
      fcf_sparkline: fullData.summary.fcf_sparkline?.slice(-period),
      ccc_sparkline: fullData.summary.ccc_sparkline?.slice(-period),
    }
  }, [fullData, division, period])

  const isLoading = status === 'loading'

  return (
    <div ref={flashRef} className="mt-12">
      <ProjectLayout
        id="command-center"
        number={1}
        title="Executive Financial Command Center"
        subtitle="The Dashboard a CFO Would Actually Use"
        question="How do I give a CFO a single view that connects P&L performance, cash flow health, working capital efficiency, and divisional revenue — from data that currently lives in disconnected spreadsheets?"
        badges={BADGES}
        pyodideStatus={STATUS_MAP[status] || 'offline'}
        codeByTab={PIPELINE_TABS}
        limitations={LIMITATIONS}
      >
        <DashboardControls
          division={division}
          onDivisionChange={setDivision}
          period={period}
          onPeriodChange={setPeriod}
        />

        <ExecutiveSummary data={filteredSummary} loading={isLoading} />

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <DivisionalPnL
            data={filteredPnL}
            selectedDivision={division}
            loading={isLoading}
          />
          <CashFlowWaterfall
            data={fullData.cashflow_waterfall}
            loading={isLoading}
          />
        </div>

        <WorkingCapitalHealth data={filteredWC} loading={isLoading} />

        <div className="mt-6">
          <button
            onClick={() => setShowRawData((v) => !v)}
            className="mb-4 flex items-center gap-2 text-xs font-medium text-text-muted transition-colors hover:text-text-secondary"
          >
            <span
              className={`inline-block transition-transform duration-200 ${showRawData ? 'rotate-90' : ''}`}
            >
              ▶
            </span>
            See the Raw Data
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              showRawData ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <RawDataViewer
              rawSample={fullData.raw_sample}
              cleanSample={fullData.clean_sample}
              validationReport={fullData.validation_report}
            />
          </div>
        </div>
      </ProjectLayout>
    </div>
  )
}
