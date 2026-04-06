import { useState, useEffect, useMemo, useRef } from 'react'
import ProjectLayout from '@/projects/ProjectLayout'
import usePyodide from '@/python/usePyodide'
import { FALLBACK_DATA } from './fallbackData'
import pipelineCode from './variance_pipeline.py?raw'

import VarianceControls from './VarianceControls'
import VarianceSummary from './VarianceSummary'
import VarianceHeatmap from './VarianceHeatmap'
import VarianceBarChart from './VarianceBarChart'
import VarianceTimeSeries from './VarianceTimeSeries'
import AnomalyTable from './AnomalyTable'

const STATUS_MAP = {
  idle: 'offline',
  loading: 'loading',
  ready: 'live',
  error: 'offline',
}

const CSV_FILES = ['budget_fy2025.csv', 'actuals_fy2025.csv']

const BADGES = [
  { label: 'Python', color: 'green' },
  { label: 'Isolation Forest', color: 'red' },
  { label: 'Pyodide', color: 'purple' },
  { label: 'Nivo Heatmap', color: 'orange' },
]

const LIMITATIONS = [
  'Anomaly detection uses Isolation Forest — no labeled training data required, but sensitivity is configurable',
  'Anomaly categorization is rule-based after ML flagging — production systems would use ensemble methods',
  'Synthetic data has 5 known anomaly types — real data has subtler patterns',
  'No drill-down to individual transactions — aggregated to monthly line-item level',
]

// Split pipeline into CodeToggle tabs
const STAGE_MARKER = '# ═══════════════════════════════════════════════════════════════'
function splitPipelineTabs(code) {
  const sections = code.split(STAGE_MARKER)
  const stages = {}
  const names = ['Ingest', 'Aggregate', 'Variance', 'Anomaly Detection', 'Output']
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

const PIPELINE_TABS = splitPipelineTabs(pipelineCode)

export default function VarianceEngineProject() {
  const { status, runPython } = usePyodide()
  const [fullData, setFullData] = useState(FALLBACK_DATA)
  const [isLive, setIsLive] = useState(false)
  const [department, setDepartment] = useState('All')
  const [anomalyType, setAnomalyType] = useState('All')
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
          if (flashRef.current) {
            flashRef.current.classList.add('data-flash')
            setTimeout(() => flashRef.current?.classList.remove('data-flash'), 600)
          }
        }
      } catch (err) {
        console.error('Variance pipeline failed:', err)
      }
    }

    run()
    return () => { cancelled = true }
  }, [status, isLive, runPython])

  // Client-side filtering
  const filteredHeatmap = useMemo(() => {
    if (!fullData.heatmap) return []
    if (department === 'All') return fullData.heatmap
    return fullData.heatmap.filter((d) => d.id === department)
  }, [fullData, department])

  const filteredBarData = useMemo(() => {
    if (!fullData.by_department) return []
    if (department === 'All') return fullData.by_department
    return fullData.by_department.filter((d) => d.department === department)
  }, [fullData, department])

  const filteredTimeSeries = useMemo(() => {
    // Time series is always company-wide (department filtering N/A at this aggregation)
    return fullData.time_series || []
  }, [fullData])

  const filteredAnomalies = useMemo(() => {
    if (!fullData.anomalies) return []
    let filtered = fullData.anomalies
    if (department !== 'All') {
      filtered = filtered.filter((a) => a.department === department)
    }
    if (anomalyType !== 'All') {
      filtered = filtered.filter((a) => a.type === anomalyType)
    }
    return filtered
  }, [fullData, department, anomalyType])

  const filteredSummary = useMemo(() => {
    if (department === 'All') {
      return { ...fullData.summary, raw_counts: fullData.raw_counts }
    }
    // Recompute for selected department
    const deptBar = fullData.by_department?.find((d) => d.department === department)
    const deptAnomalies = fullData.anomalies?.filter((a) => a.department === department) || []
    if (!deptBar) return fullData.summary

    const variance = deptBar.actual - deptBar.budget
    const variancePct = deptBar.budget ? (variance / deptBar.budget) * 100 : 0

    // Build department-scoped sparkline from heatmap data
    const deptHeatmap = fullData.heatmap?.find((h) => h.id === department)
    const deptSparkline = deptHeatmap
      ? deptHeatmap.data.map((cell) => cell.y)
      : fullData.summary.variance_sparkline

    return {
      ...fullData.summary,
      total_budget: deptBar.budget,
      total_actual: deptBar.actual,
      total_variance: variance,
      total_variance_pct: Math.round(variancePct * 10) / 10,
      anomaly_count: deptAnomalies.length,
      highest_risk_department: department,
      highest_risk_pct: Math.round(variancePct * 10) / 10,
      variance_sparkline: deptSparkline,
      raw_counts: fullData.raw_counts,
    }
  }, [fullData, department])

  const isLoading = status === 'loading'

  return (
    <div ref={flashRef} className="mt-12">
      <ProjectLayout
        id="variance-engine"
        number={3}
        title="Variance & Anomaly Engine"
        subtitle="The System That Finds What Humans Miss"
        question="We have 5,000+ transactions across 5 departments. Where are we over budget? Which variances are normal noise and which are genuine anomalies — trending overspends, duplicate payments, threshold gaming?"
        badges={BADGES}
        pyodideStatus={STATUS_MAP[status] || 'offline'}
        codeByTab={PIPELINE_TABS}
        limitations={LIMITATIONS}
      >
        <VarianceControls
          department={department}
          onDepartmentChange={setDepartment}
          anomalyType={anomalyType}
          onAnomalyTypeChange={setAnomalyType}
        />

        <VarianceSummary data={filteredSummary} loading={isLoading} />

        <VarianceHeatmap
          data={filteredHeatmap}
          loading={isLoading}
          onCellClick={(cell) => {
            const dept = cell.serieId
            setDepartment((prev) => (prev === dept ? 'All' : dept))
          }}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <VarianceBarChart data={filteredBarData} loading={isLoading} />
          <VarianceTimeSeries data={filteredTimeSeries} loading={isLoading} />
        </div>

        <AnomalyTable anomalies={filteredAnomalies} />
      </ProjectLayout>
    </div>
  )
}
