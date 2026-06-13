import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/python/usePyodide', () => ({
  default: () => ({
    status: 'ready',
    progress: 100,
    progressLabel: '',
    error: null,
    runPython: vi.fn().mockResolvedValue(null),
    loadPackages: vi.fn(),
  }),
}))

import AiValueTest from '@/pages/AiValueTest'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/ai']}>
      <AiValueTest />
    </MemoryRouter>
  )
}

describe('AiValueTest page', () => {
  it('renders the manifesto thesis and the embedded live model', () => {
    renderPage()
    // headline is split into per-word spans for the stagger, so assert on the
    // single-element eyebrow + essay lead instead of the full headline string
    expect(screen.getByText('The AI Value Test')).toBeInTheDocument()
    expect(
      screen.getByText('Every AI budget is approved on a promise.')
    ).toBeInTheDocument()
    expect(screen.getByText('Risk-adjusted ROI')).toBeInTheDocument()
  })

  it('links back to the three Home systems and funnels to Contact', () => {
    const { container } = renderPage()
    expect(container.querySelector('a[href="/#command-center"]')).toBeTruthy()
    expect(container.querySelector('a[href="/#decision-impact"]')).toBeTruthy()
    expect(container.querySelector('a[href="/#variance-engine"]')).toBeTruthy()
    expect(container.querySelector('a[href="/#contact"]')).toBeTruthy()
  })
})
