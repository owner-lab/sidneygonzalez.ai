import { useState, useMemo, useCallback } from 'react'
import ProjectLayout from '@/projects/ProjectLayout'
import usePyodide from '@/python/usePyodide'
import {
  FALLBACK_ORG_MODEL,
  FALLBACK_SCENARIOS,
  KPI_LABELS,
  KPI_DIVISIONS,
} from './fallbackData'
import engineCode from './scenario_engine.py?raw'

import ScenarioSelector from './ScenarioSelector'
import ImpactSankey from './ImpactSankey'
import CascadeTable from './CascadeTable'
import QuarterlyBreakdown from './QuarterlyBreakdown'
import ExecutiveNarrative from './ExecutiveNarrative'
import CustomScenarioBuilder from './CustomScenarioBuilder'

const STATUS_MAP = {
  idle: 'offline',
  loading: 'loading',
  ready: 'live',
  error: 'offline',
}

const BADGES = [
  { label: 'Python', color: 'green' },
  { label: 'DAG Propagation', color: 'blue' },
  { label: 'Pyodide', color: 'purple' },
  { label: 'Nivo Sankey', color: 'orange' },
]

const LIMITATIONS = [
  'Coefficients are illustrative — production models calibrate from historical data',
  'Linear propagation; real systems have non-linear feedback loops',
  'No Monte Carlo uncertainty — sigma values shown but not sampled',
  'Quarterly granularity; monthly effects are approximated',
]

// Build KPI unit lookup from org model
function buildKpiUnits(orgModel) {
  const units = {}
  for (const div of Object.values(orgModel.divisions)) {
    for (const kpi of div.kpis) {
      units[kpi.id] = kpi.unit
    }
  }
  return units
}

// Split engine code into CodeToggle tabs
const STAGE_MARKER = '# ═══════════════════════════════════════════════════════════════'
function splitEngineTabs(code) {
  const sections = code.split(STAGE_MARKER)
  const stages = {}
  const names = ['Parse Model', 'Propagate', 'Output']
  let nameIdx = 0

  for (const section of sections) {
    if (section.includes('STAGE') && nameIdx < names.length) {
      stages[names[nameIdx]] = section.trim()
      nameIdx++
    }
  }

  if (nameIdx === 0) return { 'Full Code': code }
  return stages
}

const ENGINE_TABS = splitEngineTabs(engineCode)

export default function DecisionImpactProject() {
  const { status, runPython } = usePyodide()
  const [activeScenarioId, setActiveScenarioId] = useState(null)
  const [customResult, setCustomResult] = useState(null)
  const [isComputing, setIsComputing] = useState(false)

  const orgModel = FALLBACK_ORG_MODEL
  const scenarios = FALLBACK_SCENARIOS.scenarios
  const kpiUnits = useMemo(() => buildKpiUnits(orgModel), [orgModel])

  // Get active scenario data
  const activeScenario = useMemo(() => {
    if (!activeScenarioId) return null
    return scenarios.find((s) => s.id === activeScenarioId) || null
  }, [activeScenarioId, scenarios])

  // Determine cascade data to display
  const displayCascade = useMemo(() => {
    if (!activeScenario) return null
    if (activeScenario.id === 'custom' && customResult) {
      return customResult.cascade
    }
    return activeScenario.cascade
  }, [activeScenario, customResult])

  // Determine quarterly data to display
  const displayQuarterly = useMemo(() => {
    if (!activeScenario) return null
    if (activeScenario.id === 'custom' && customResult) {
      return customResult.quarterly
    }
    return activeScenario.quarterly
  }, [activeScenario, customResult])

  // Build affected links for Sankey highlighting
  const affectedLinks = useMemo(() => {
    if (!activeScenario) return null

    // For custom scenarios with Pyodide result, use the affected_links directly
    if (activeScenario.id === 'custom' && customResult?.affected_links) {
      return customResult.affected_links
    }

    // For presets, derive affected links from cascade data
    if (!activeScenario.cascade || activeScenario.cascade.length === 0) return null

    const affectedKpis = new Set(activeScenario.cascade.map((c) => c.kpi))
    const links = []

    for (const edge of orgModel.interdependencies) {
      if (affectedKpis.has(edge.from_kpi) && affectedKpis.has(edge.to_kpi)) {
        // Determine impact direction from cascade change_pct of source
        const sourceData = activeScenario.cascade.find(
          (c) => c.kpi === edge.from_kpi
        )
        const delta = (sourceData?.change_pct || 0) * edge.coefficient
        links.push({
          source: edge.from_kpi,
          target: edge.to_kpi,
          impact: delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral',
        })
      }
    }

    return links.length > 0 ? links : null
  }, [activeScenario, customResult, orgModel])

  // Narrative (presets only — custom has no pre-written narrative)
  const narrative = activeScenario?.id !== 'custom' ? activeScenario?.narrative : null

  // Run custom scenario via Pyodide
  const handleRunCustom = useCallback(
    async (inputChanges) => {
      if (status !== 'ready') return

      setIsComputing(true)
      setCustomResult(null)

      try {
        const result = await runPython(engineCode, {
          params: {
            org_model_json: JSON.stringify(orgModel),
            input_changes_json: JSON.stringify(inputChanges),
          },
        })
        if (result) {
          setCustomResult(result)
        }
      } catch (err) {
        console.error('Scenario engine failed:', err)
      } finally {
        setIsComputing(false)
      }
    },
    [status, runPython, orgModel]
  )

  const isCustom = activeScenarioId === 'custom'

  return (
    <div className="mt-12">
      <ProjectLayout
        id="decision-impact"
        number={2}
        title="Decision Impact Analyzer"
        subtitle="Every Decision Has a Second-Order Effect"
        question="If I cut the marketing budget by 15%, what happens to pipeline value in Q2? If I freeze engineering hiring, when does product NPS start to decline? How do these cascading effects connect across divisions?"
        badges={BADGES}
        pyodideStatus={STATUS_MAP[status] || 'offline'}
        codeByTab={ENGINE_TABS}
        limitations={LIMITATIONS}
      >
        <ScenarioSelector
          scenarios={scenarios}
          activeId={activeScenarioId}
          onSelect={setActiveScenarioId}
        />

        <ImpactSankey
          orgModel={orgModel}
          kpiLabels={KPI_LABELS}
          kpiDivisions={KPI_DIVISIONS}
          affectedLinks={affectedLinks}
          loading={false}
        />

        {displayCascade && displayCascade.length > 0 && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <CascadeTable
              cascade={displayCascade}
              kpiLabels={KPI_LABELS}
              kpiUnits={kpiUnits}
            />
            <QuarterlyBreakdown
              quarterly={displayQuarterly}
              kpiLabels={KPI_LABELS}
            />
          </div>
        )}

        {narrative && (
          <ExecutiveNarrative
            narrative={narrative}
            scenarioLabel={activeScenario?.label}
          />
        )}

        {isCustom && (
          <CustomScenarioBuilder
            orgModel={orgModel}
            kpiLabels={KPI_LABELS}
            pyodideReady={status === 'ready'}
            isComputing={isComputing}
            onRun={handleRunCustom}
          />
        )}
      </ProjectLayout>
    </div>
  )
}
