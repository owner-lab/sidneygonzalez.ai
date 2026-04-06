import { useState } from 'react'
import GlassPanel from '@/components/ui/GlassPanel'
import Slider from '@/components/ui/Slider'
import Button from '@/components/ui/Button'

// Only expose input KPIs that make sense for executive decisions
const ADJUSTABLE_KPIS = [
  'marketing_spend',
  'eng_headcount',
  'ops_budget',
  'dso',
]

export default function CustomScenarioBuilder({
  orgModel,
  kpiLabels,
  pyodideReady,
  isComputing,
  onRun,
}) {
  const [inputs, setInputs] = useState({})

  if (!orgModel) return null

  // Build list of adjustable KPIs with their baselines
  const adjustableKpis = []
  for (const div of Object.values(orgModel.divisions)) {
    for (const kpi of div.kpis) {
      if (ADJUSTABLE_KPIS.includes(kpi.id)) {
        adjustableKpis.push({
          ...kpi,
          division: div.label,
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
    // Build input_changes from non-zero sliders
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

      <div className="grid gap-4 sm:grid-cols-2">
        {adjustableKpis.map((kpi) => (
          <div key={kpi.id}>
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-text-muted">
              {kpi.division}
            </span>
            <Slider
              label={kpiLabels[kpi.id] || kpi.label}
              value={kpi.currentChange}
              min={-50}
              max={50}
              step={5}
              onChange={(val) => handleSliderChange(kpi.id, val)}
              formatValue={(v) => `${v > 0 ? '+' : ''}${v}%`}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
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
          Reset
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
