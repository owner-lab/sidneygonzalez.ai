import { useState } from 'react'
import GlassPanel from '@/components/ui/GlassPanel'
import Slider from '@/components/ui/Slider'
import Button from '@/components/ui/Button'

const ADJUSTABLE_KPIS = [
  'marketing_spend',
  'eng_headcount',
  'ops_budget',
  'dso',
]

const DIVISION_ABBREV = {
  'Marketing': 'MKT',
  'Engineering & Product': 'ENG',
  'Operations': 'OPS',
  'Finance': 'FIN',
  'Sales': 'SALES',
}

export default function CustomScenarioBuilder({
  orgModel,
  kpiLabels,
  pyodideReady,
  isComputing,
  onRun,
}) {
  const [inputs, setInputs] = useState({})

  if (!orgModel) return null

  const adjustableKpis = []
  for (const div of Object.values(orgModel.divisions)) {
    for (const kpi of div.kpis) {
      if (ADJUSTABLE_KPIS.includes(kpi.id)) {
        adjustableKpis.push({
          ...kpi,
          division: div.label,
          divisionTag: DIVISION_ABBREV[div.label] || div.label,
          currentChange: inputs[kpi.id] || 0,
        })
      }
    }
  }

  function handleSliderChange(kpiId, value) {
    setInputs((prev) => ({ ...prev, [kpiId]: value }))
  }

  function handleReset() {
    setInputs({})
  }

  function handleRun() {
    const inputChanges = Object.entries(inputs)
      .filter(([, pct]) => pct !== 0)
      .map(([kpi, pct]) => ({ kpi, change_pct: pct }))

    if (inputChanges.length === 0) return
    onRun(inputChanges)
  }

  const hasChanges = Object.values(inputs).some((v) => v !== 0)

  return (
    <GlassPanel className="mt-6">
      <div className="mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Custom Scenario Builder
        </h4>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
        {adjustableKpis.map((kpi) => (
          <Slider
            key={kpi.id}
            label={kpiLabels[kpi.id] || kpi.label}
            divisionLabel={kpi.divisionTag}
            value={kpi.currentChange}
            min={-50}
            max={50}
            step={5}
            onChange={(val) => handleSliderChange(kpi.id, val)}
            formatValue={(v) => `${v > 0 ? '+' : ''}${v}%`}
            showRange
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button
          variant="primary"
          onClick={handleRun}
          className={!pyodideReady || !hasChanges || isComputing ? 'pointer-events-none opacity-50' : ''}
        >
          {isComputing ? 'Computing...' : 'Run Scenario'}
        </Button>
        <Button
          variant="ghost"
          className={`text-xs ${!hasChanges ? 'pointer-events-none opacity-30' : ''}`}
          onClick={handleReset}
        >
          Reset All
        </Button>
        {!pyodideReady && (
          <span className="text-xs text-text-muted">
            Waiting for Python runtime...
          </span>
        )}
      </div>
    </GlassPanel>
  )
}
