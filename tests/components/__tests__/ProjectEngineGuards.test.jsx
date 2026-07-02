import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FALLBACK_DATA as CMD } from '@/projects/command-center/fallbackData'
import { FALLBACK_SCENARIOS, FALLBACK_ORG_MODEL } from '@/projects/decision-impact/fallbackData'
import { FALLBACK_DATA as VAR } from '@/projects/variance-engine/fallbackData'
import ExecutiveSummary from '@/projects/command-center/ExecutiveSummary'
import VarianceSummary from '@/projects/variance-engine/VarianceSummary'

// Numeric-sanity regression guards on the committed fallback data the dashboards seed from.
// They mirror the Python data-gates so a bad regeneration also trips the JS/CI suite, and
// pin the specific defects found in the cross-project audit so they can't silently return.

describe('Command Center (P1) fallback integrity', () => {
  it('CCC equals its displayed identity DSO + DIO - DPO every month', () => {
    const maxDiff = Math.max(
      ...CMD.working_capital.map((r) => Math.abs(r.ccc - (r.dso + r.dio - r.dpo)))
    )
    expect(maxDiff).toBeLessThan(0.05)
  })

  it('cash-flow waterfall reconciles and FCF equals its sparkline sum', () => {
    const w = CMD.cashflow_waterfall
    expect(Math.abs(w.operating + w.investing + w.financing - w.net)).toBeLessThan(1)
    const fcfSum = CMD.summary.fcf_sparkline.reduce((a, b) => a + b, 0)
    expect(Math.abs(CMD.summary.free_cash_flow - fcfSum)).toBeLessThan(1)
  })

  it('labels FCF and CCC "company-wide" when a single division is selected', () => {
    render(<ExecutiveSummary data={{ ...CMD.summary }} division="Cloud Infrastructure" />)
    expect(screen.getAllByText('company-wide').length).toBe(2)
  })

  it('shows no company-wide caption for the whole company (division = All)', () => {
    render(<ExecutiveSummary data={{ ...CMD.summary }} division="All" />)
    expect(screen.queryByText('company-wide')).toBeNull()
  })
})

describe('Decision Impact (P2) fallback integrity', () => {
  const UNIT_BOUNDS = {
    score_1_5: [1, 5],
    percent: [0, 100],
    index_0_100: [0, 100],
    score: [-100, 100],
  }
  const units = {}
  for (const div of Object.values(FALLBACK_ORG_MODEL.divisions))
    for (const kpi of div.kpis) units[kpi.id] = kpi.unit

  it('no preset cascade value leaves its unit domain (CSAT <= 5, percents in [0,100], churn >= 0)', () => {
    for (const s of FALLBACK_SCENARIOS.scenarios) {
      for (const c of s.cascade || []) {
        const b = UNIT_BOUNDS[units[c.kpi]]
        if (!b) continue
        expect(c.projected, `${s.id}:${c.kpi}`).toBeGreaterThanOrEqual(b[0] - 1e-9)
        expect(c.projected, `${s.id}:${c.kpi}`).toBeLessThanOrEqual(b[1] + 1e-9)
      }
    }
  })

  it('every preset narrative is substantive prose with no templating leftovers', () => {
    for (const s of FALLBACK_SCENARIOS.scenarios) {
      if (s.id === 'custom') continue
      expect(s.narrative.length, s.id).toBeGreaterThan(40)
      expect(s.narrative, s.id).not.toMatch(/[{}]|undefined|NaN/)
    }
  })
})

describe('Variance Engine (P3) fallback integrity', () => {
  it('by_department reconciles to total_variance', () => {
    const recon = VAR.by_department.reduce((a, d) => a + (d.actual - d.budget), 0)
    expect(Math.abs(recon - VAR.summary.total_variance)).toBeLessThan(1)
  })

  it('highest_risk_pct is finite and its sign matches the dept being over/under budget', () => {
    const hrp = VAR.summary.highest_risk_pct
    expect(Number.isFinite(hrp)).toBe(true)
    const hr = VAR.by_department.find((d) => d.department === VAR.summary.highest_risk_department)
    if (hrp !== 0) expect(hrp > 0).toBe(hr.actual > hr.budget)
  })

  it('all heatmap cells are finite numbers', () => {
    for (const row of VAR.heatmap) for (const c of row.data) expect(Number.isFinite(c.y)).toBe(true)
  })

  it('colors the Highest Risk stat by sign — green for an under-budget department, not hardcoded red', () => {
    const data = { ...VAR.summary, highest_risk_department: 'Capital', highest_risk_pct: -40 }
    render(<VarianceSummary data={data} loading={false} />)
    const el = screen.getByText('-40% variance')
    expect(el.className).toMatch(/impact-positive/)
  })
})
