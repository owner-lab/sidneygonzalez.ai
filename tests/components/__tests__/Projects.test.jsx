import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/python/usePyodide', () => ({
  default: () => ({
    status: 'ready',
    progress: 100,
    progressLabel: '',
    error: null,
    runPython: vi.fn(),
    loadPackages: vi.fn(),
  }),
}))
// Keep the heavy chart projects out of jsdom — the stack tiles and CTA are
// rendered eagerly by Projects regardless.
vi.mock('@/projects/command-center/CommandCenterProject', () => ({ default: () => null }))
vi.mock('@/projects/decision-impact/DecisionImpactProject', () => ({ default: () => null }))
vi.mock('@/projects/variance-engine/VarianceEngineProject', () => ({ default: () => null }))

import Projects from '@/sections/Projects'

describe('Projects (Home)', () => {
  it('renders the three-system stack and the /ai CTA bridge', () => {
    const { container } = render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    )
    expect(screen.getByText('Command Center')).toBeInTheDocument()
    expect(screen.getByText('Decision Analyzer')).toBeInTheDocument()
    expect(screen.getByText('Variance Engine')).toBeInTheDocument()
    expect(container.querySelector('a[href="/ai"]')).toBeTruthy()
  })
})
