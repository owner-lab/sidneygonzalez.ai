import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FALLBACK_RESULT } from '@/features/ai-value-model/fallbackData'

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

import AiValueModel from '@/features/ai-value-model/AiValueModel'

describe('AiValueModel', () => {
  beforeEach(() => {
    runPython.mockReset()
    runPython.mockResolvedValue(FALLBACK_RESULT)
  })

  it('renders results from the fallback (never-blank contract)', () => {
    render(<AiValueModel variant="luminous" />)
    expect(screen.getByText('Risk-adjusted ROI')).toBeInTheDocument()
    // FALLBACK_RESULT.roi_pct === 229.1 (10% discounted default) → formatRoiPercent → "+229%"
    expect(screen.getByText('+229%')).toBeInTheDocument()
  })

  it('recomputes in Python when an input changes', async () => {
    render(<AiValueModel variant="luminous" />)
    await waitFor(() => expect(runPython).toHaveBeenCalled())
    const before = runPython.mock.calls.length

    fireEvent.change(screen.getByLabelText('Initial investment (one-time)'), {
      target: { value: '5000000' },
    })
    await waitFor(() =>
      expect(runPython.mock.calls.length).toBeGreaterThan(before)
    )
  })

  it('opens the View Code panel', () => {
    render(<AiValueModel variant="luminous" />)
    fireEvent.click(screen.getByRole('button', { name: 'View Code' }))
    expect(
      screen.getByRole('button', { name: 'Close code panel' })
    ).toBeInTheDocument()
  })

  it('exposes a discount-rate (NPV) control that recomputes on change', async () => {
    render(<AiValueModel variant="luminous" />)
    const discount = screen.getByLabelText('Discount rate (NPV)')
    expect(discount).toBeInTheDocument()
    await waitFor(() => expect(runPython).toHaveBeenCalled())
    const before = runPython.mock.calls.length
    // default is 10% — move it to 15% so the value actually changes
    fireEvent.change(discount, { target: { value: '15' } })
    await waitFor(() =>
      expect(runPython.mock.calls.length).toBeGreaterThan(before)
    )
  })

  // Regression: the tornado used to render "AI value income" and "Success
  // probability" as byte-identical bars (both ±20% linear multipliers on the same
  // term). Per-driver ranges must keep them distinct so the chart doesn't double-
  // count one lever as two independent risks.
  it('does not show AI value income and success probability as duplicate tornado bars', () => {
    const byFactor = Object.fromEntries(
      FALLBACK_RESULT.sensitivity.map((s) => [s.factor, s])
    )
    expect(byFactor['AI value income'].swing).not.toBe(
      byFactor['Success probability'].swing
    )
  })
})
