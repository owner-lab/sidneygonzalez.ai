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
    // FALLBACK_RESULT.roi_pct === 260 → formatRoiPercent → "+260%"
    expect(screen.getByText('+260%')).toBeInTheDocument()
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
})
