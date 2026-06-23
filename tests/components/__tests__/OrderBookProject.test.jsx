import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FALLBACK_RESULT } from '@/projects/order-book/fallbackData'

const runPython = vi.fn()
vi.mock('@/python/usePyodide', () => ({
  default: () => ({
    status: 'ready',
    progress: 100,
    progressLabel: '',
    error: null,
    runPython,
    loadPackages: vi.fn(),
  }),
}))

import OrderBookProject from '@/projects/order-book/OrderBookProject'
import HeadcountRoiPanel from '@/projects/order-book/HeadcountRoiPanel'

function renderProject() {
  return render(
    <MemoryRouter>
      <OrderBookProject />
    </MemoryRouter>
  )
}

describe('OrderBookProject', () => {
  beforeEach(() => {
    runPython.mockReset()
    runPython.mockResolvedValue(FALLBACK_RESULT)
  })

  it('renders results from the fallback (never-blank contract)', () => {
    renderProject()
    expect(screen.getByText('Risk-adjusted ROI')).toBeInTheDocument()
    // FALLBACK_RESULT.roi_pct === 19.1 → formatRoiPercent → "+19.1%"
    expect(screen.getAllByText('+19.1%').length).toBeGreaterThan(0)
  })

  it('recomputes in Python when the delivery-teams lever changes', async () => {
    renderProject()
    await waitFor(() => expect(runPython).toHaveBeenCalled())
    const before = runPython.mock.calls.length

    fireEvent.change(screen.getByLabelText('Delivery teams'), { target: { value: '5' } })
    await waitFor(() => expect(runPython.mock.calls.length).toBeGreaterThan(before))
  })

  it('exposes a discount-rate (NPV) control that recomputes on change', async () => {
    renderProject()
    const discount = screen.getByLabelText('Discount rate (NPV)')
    expect(discount).toBeInTheDocument()
    await waitFor(() => expect(runPython).toHaveBeenCalled())
    const before = runPython.mock.calls.length
    fireEvent.change(discount, { target: { value: '15' } })
    await waitFor(() => expect(runPython.mock.calls.length).toBeGreaterThan(before))
  })

  it('recomputes when the editable order book changes (model your own business)', async () => {
    renderProject()
    await waitFor(() => expect(runPython).toHaveBeenCalled())
    // The editor is collapsed by default — open it, then edit the first project's value.
    fireEvent.click(screen.getByRole('button', { name: /Your Order Book/i }))
    const before = runPython.mock.calls.length
    fireEvent.change(screen.getByLabelText('Project 1 value'), { target: { value: '500000' } })
    await waitFor(() => expect(runPython.mock.calls.length).toBeGreaterThan(before))
  })

  it('opens the View Code panel', () => {
    renderProject()
    fireEvent.click(screen.getByRole('button', { name: 'View Code' }))
    expect(screen.getByRole('button', { name: 'Close code panel' })).toBeInTheDocument()
  })

  it('keeps the sensitivity tornado de-duplicated (per-driver native ranges)', () => {
    // Cost per team (±20% relative) and Order-intake growth (±0.04 absolute) are
    // distinct drivers — their ROI swings must not collapse to identical bars.
    const byFactor = Object.fromEntries(FALLBACK_RESULT.sensitivity.map((s) => [s.factor, s]))
    expect(byFactor['Cost per team']).toBeDefined()
    expect(byFactor['Order-intake growth']).toBeDefined()
    expect(byFactor['Cost per team'].swing).not.toBe(byFactor['Order-intake growth'].swing)
  })

  it('renders undefined ROI/payback as "n/a", never a bogus -100% or 1-month payback', () => {
    // The added_teams==0 guard path: ROI and payback are null.
    const nullRoi = {
      headcount_roi: {
        added_teams: 0, baseline_teams: 3, incremental_pv_margin: 0, quality_pv_gain: 0,
        throughput_pv_gain: 0, initial_cost: 0, annual_cost: 0, total_cost: 0, cost_valid: false,
        raw_multiple: null, roi_pct: null, npv: 0, payback_months: null,
        discount_rate: 0.1, revenue_realization: 0.85,
      },
      summary: {
        company: 'Meridian Technologies', backlog_projects: 11, backlog_value: 29230000,
        horizon_months: 18, realized_total: 0, at_risk_total: 0, at_risk_share_pct: 0,
        months_capacity_short: 0, backlog_cleared_pct: 84,
      },
      sensitivity: [],
    }
    render(<HeadcountRoiPanel result={nullRoi} flashKey={0} />)
    expect(screen.getAllByText('n/a').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('-100%')).toBeNull()
  })
})
