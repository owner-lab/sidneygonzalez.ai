# Sonnet Handoff: UX Fix Batch — 4 Issues

## Your Task

Implement 4 targeted UX fixes across the portfolio. Work on the `dev` branch. Make all changes, then commit with a single conventional commit message and open a PR to `main`. Do NOT include a Co-Authored-By line in the commit.

**Branch:** `dev`
**Commit style:** `fix: correct UX issues across portfolio — scroll, layout, filter placement, raw data toggle`

---

## Fix 1 — QuarterlyBreakdown layout distortion

**File:** `src/projects/decision-impact/QuarterlyBreakdown.jsx`

**Problem:** When Scenario 1 is selected, the Timeline panel's 3-column layout distorts. Long KPI names like "Customer Acquisition Cost ($)" force the `flex-1` columns wider than their fair share, pushing badges outside their bounds. Root cause: `flex-1` without `min-w-0` on flex children.

### Change A — Line 14: add `min-w-0` to QuarterColumn container

Find:
```jsx
    <div className="flex-1">
```

Replace with:
```jsx
    <div className="min-w-0 flex-1">
```

### Change B — Lines 29–32: fix row alignment and label overflow

Find:
```jsx
              <div
                key={kpi.kpi}
                className="flex items-center justify-between rounded-md bg-bg-surface/50 px-2.5 py-1.5"
              >
                <span className="text-xs text-text-secondary">
                  {kpiLabels[kpi.kpi] || kpi.kpi}
                </span>
```

Replace with:
```jsx
              <div
                key={kpi.kpi}
                className="flex items-start justify-between gap-2 rounded-md bg-bg-surface/50 px-2.5 py-1.5"
              >
                <span className="min-w-0 flex-1 text-xs leading-tight text-text-secondary">
                  {kpiLabels[kpi.kpi] || kpi.kpi}
                </span>
```

---

## Fix 2 — CodeToggle: vertical scroll works without horizontal scroll first

**File:** `src/components/ui/CodeToggle.jsx`

**Problem:** The `<pre>` element uses `white-space: pre` (browser default), so long code lines create horizontal overflow on the outer `overflow-auto` container. On macOS trackpad, the browser then intercepts vertical scroll gestures as horizontal intent, so users must scroll horizontally before vertical scroll activates.

**Fix:** Split scroll axes — outer container handles only vertical, `<pre>` handles its own horizontal.

Find (around line 88):
```jsx
              <div className="flex-1 overflow-auto overscroll-contain py-4">
                <pre className="font-mono text-xs leading-relaxed text-text-secondary">
```

Replace with:
```jsx
              <div className="flex-1 overflow-y-auto overscroll-contain py-4">
                <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
```

---

## Fix 3 — Move Anomaly Type filter to sit above the Anomaly Table

**Problem:** The Anomaly Type filter buttons are in `VarianceControls` at the top of the page, but the table they filter (`AnomalyTable`) is at the very bottom. Users see the buttons before any anomaly data and don't understand what they affect. The Department filter is fine at the top because it affects all visuals. The Anomaly Type filter must live directly above the table it controls.

### 3a. `src/projects/variance-engine/VarianceControls.jsx`

Remove the `ANOMALY_TYPES` constant (lines 13–20), remove `anomalyType`/`onAnomalyTypeChange` props, and remove the anomaly filter section from the JSX. The entire file should become:

```jsx
import Button from '@/components/ui/Button'
import GlassPanel from '@/components/ui/GlassPanel'

const DEPARTMENTS = [
  { key: 'All', label: 'All Departments' },
  { key: 'Engineering', label: 'Engineering' },
  { key: 'Sales', label: 'Sales' },
  { key: 'Marketing', label: 'Marketing' },
  { key: 'Operations', label: 'Operations' },
  { key: 'Finance', label: 'Finance' },
]

export default function VarianceControls({ department, onDepartmentChange }) {
  return (
    <GlassPanel className="mb-6 p-3">
      <div className="flex flex-wrap gap-1.5">
        {DEPARTMENTS.map(({ key, label }) => (
          <Button
            key={key}
            variant={department === key ? 'secondary' : 'ghost'}
            className="text-xs"
            onClick={() => onDepartmentChange(key)}
          >
            {label}
          </Button>
        ))}
      </div>
    </GlassPanel>
  )
}
```

### 3b. `src/projects/variance-engine/AnomalyTable.jsx`

Add a `Button` import and the `ANOMALY_TYPES` constant at the top. Accept `anomalyType` and `onAnomalyTypeChange` as props. Render filter buttons inside the component header, right after the existing title row.

**Step 1** — Update imports. Find:
```jsx
import { useState } from 'react'
import GlassPanel from '@/components/ui/GlassPanel'
import Badge from '@/components/ui/Badge'
import { formatVariance } from '@/utils/formatters'
```

Replace with:
```jsx
import { useState } from 'react'
import GlassPanel from '@/components/ui/GlassPanel'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatVariance } from '@/utils/formatters'
```

**Step 2** — Add the constant and update the component signature. Find:
```jsx
export default function AnomalyTable({ anomalies }) {
```

Replace with:
```jsx
const ANOMALY_TYPES = [
  { key: 'All', label: 'All Types' },
  { key: 'trending_overspend', label: 'Trending' },
  { key: 'seasonal_spike', label: 'Seasonal' },
  { key: 'threshold_cluster', label: 'Threshold' },
  { key: 'duplicate_payment', label: 'Duplicate' },
  { key: 'one_time_event', label: 'One-Time' },
]

export default function AnomalyTable({ anomalies, anomalyType = 'All', onAnomalyTypeChange }) {
```

**Step 3** — Add the filter row inside the GlassPanel, right after the title/count header div. Find:
```jsx
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Detected Anomalies
        </h4>
        <span className="text-xs text-text-muted">{anomalies.length} flagged</span>
      </div>
```

Replace with:
```jsx
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Detected Anomalies
        </h4>
        <span className="text-xs text-text-muted">{anomalies.length} flagged</span>
      </div>

      {onAnomalyTypeChange && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {ANOMALY_TYPES.map(({ key, label }) => (
            <Button
              key={key}
              variant={anomalyType === key ? 'secondary' : 'ghost'}
              className="text-xs"
              onClick={() => onAnomalyTypeChange(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
```

### 3c. `src/projects/variance-engine/VarianceEngineProject.jsx`

**Step 1** — Remove anomaly type props from `VarianceControls`. Find:
```jsx
        <VarianceControls
          department={department}
          onDepartmentChange={setDepartment}
          anomalyType={anomalyType}
          onAnomalyTypeChange={setAnomalyType}
        />
```

Replace with:
```jsx
        <VarianceControls
          department={department}
          onDepartmentChange={setDepartment}
        />
```

**Step 2** — Pass anomaly type props to `AnomalyTable`. Find:
```jsx
        <AnomalyTable anomalies={filteredAnomalies} />
```

Replace with:
```jsx
        <AnomalyTable
          anomalies={filteredAnomalies}
          anomalyType={anomalyType}
          onAnomalyTypeChange={setAnomalyType}
        />
```

---

## Fix 4 — Move "See Raw Data" toggle next to the raw data

**Problem:** The "See Raw Data" toggle is in `DashboardControls` at the top of the Command Center project, but the `RawDataViewer` panel expands at the very bottom of the page. When a user clicks the toggle, nothing visible changes in their current viewport — the effect is entirely off-screen. Fix: remove toggle from controls bar, add it directly above the raw data panel.

### 4a. `src/projects/command-center/DashboardControls.jsx`

Remove the Toggle import, `showRawData`/`onShowRawDataChange` props, and the toggle JSX block. The entire file should become:

```jsx
import Button from '@/components/ui/Button'
import GlassPanel from '@/components/ui/GlassPanel'

const DIVISIONS = [
  { key: 'All', label: 'All Divisions', color: null },
  { key: 'Enterprise Software', label: 'Enterprise SW', color: '#0068FF' },
  { key: 'Professional Services', label: 'Prof Services', color: '#4AF6C3' },
  { key: 'Cloud Infrastructure', label: 'Cloud Infra', color: '#A78BFA' },
]

const PERIODS = [6, 12, 24]

export default function DashboardControls({
  division,
  onDivisionChange,
  period,
  onPeriodChange,
}) {
  return (
    <GlassPanel className="mb-6 flex flex-col gap-4 p-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Division selector */}
      <div className="flex flex-wrap gap-1.5">
        {DIVISIONS.map(({ key, label, color }) => (
          <Button
            key={key}
            variant={division === key ? 'secondary' : 'ghost'}
            className="text-xs"
            onClick={() => onDivisionChange(key)}
          >
            {color && (
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            {label}
          </Button>
        ))}
      </div>

      {/* Period selector */}
      <div className="flex gap-1.5">
        {PERIODS.map((p) => (
          <Button
            key={p}
            variant={period === p ? 'secondary' : 'ghost'}
            className="text-xs"
            onClick={() => onPeriodChange(p)}
          >
            {p}M
          </Button>
        ))}
      </div>
    </GlassPanel>
  )
}
```

### 4b. `src/projects/command-center/CommandCenterProject.jsx`

**Step 1** — Remove `showRawData`/`onShowRawDataChange` from the DashboardControls call. Find:
```jsx
        <DashboardControls
          division={division}
          onDivisionChange={setDivision}
          period={period}
          onPeriodChange={setPeriod}
          showRawData={showRawData}
          onShowRawDataChange={setShowRawData}
        />
```

Replace with:
```jsx
        <DashboardControls
          division={division}
          onDivisionChange={setDivision}
          period={period}
          onPeriodChange={setPeriod}
        />
```

**Step 2** — Replace the raw data container with a toggle + panel. Find:
```jsx
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
```

Replace with:
```jsx
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
```

---

## Files Changed

- `src/projects/decision-impact/QuarterlyBreakdown.jsx`
- `src/components/ui/CodeToggle.jsx`
- `src/projects/variance-engine/VarianceControls.jsx`
- `src/projects/variance-engine/AnomalyTable.jsx`
- `src/projects/variance-engine/VarianceEngineProject.jsx`
- `src/projects/command-center/DashboardControls.jsx`
- `src/projects/command-center/CommandCenterProject.jsx`

---

## Verification Checklist

1. **Scenario distortion** — Click Scenario 1 in Decision Impact → Timeline panel shows Q1/Q2/Q4 columns cleanly; long KPI names wrap within their column bounds; no badges overflow
2. **View Code scroll** — Open View Code on any project → immediately scroll vertically with two-finger trackpad gesture → code scrolls without needing to scroll horizontally first; long lines scroll horizontally within the code block only
3. **Variance filter placement** — Open Variance Engine → only Department buttons appear at the top; scroll down to Detected Anomalies → Anomaly Type filter buttons appear directly above the table; clicking a type immediately filters the rows visible in the same viewport
4. **Raw Data toggle** — Scroll to bottom of Command Center → small "▶ See the Raw Data" button visible above where data will expand; clicking it expands the panel immediately below; no confusion about what changed
