import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PyodideFallback from '@/components/ui/PyodideFallback'
import EngineErrorBanner from '@/components/ui/EngineErrorBanner'
import { ProjectCodeContext } from '@/hooks/useProjectCode'

// The repo is private, so these fallbacks no longer link to GitHub — their
// escape hatch is the in-page "View Code" slide-out, reached through
// ProjectCodeContext. That context is positional: a component rendered ABOVE
// the provider silently reads null and loses its CTA, which is the exact way
// this wiring breaks. These tests pin both halves.

describe('PyodideFallback code escape hatch', () => {
  it('offers the code CTA when rendered inside a project', () => {
    const openCode = vi.fn()
    render(
      <ProjectCodeContext.Provider value={openCode}>
        <PyodideFallback error="worker failed" />
      </ProjectCodeContext.Provider>
    )

    fireEvent.click(
      screen.getByRole('button', { name: /view the pipeline code/i })
    )
    expect(openCode).toHaveBeenCalledTimes(1)
  })

  it('degrades to no CTA outside a project instead of crashing', () => {
    render(<PyodideFallback error="worker failed" />)

    expect(screen.getByText(/live demo unavailable/i)).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('never renders an outbound repo link', () => {
    const { container } = render(
      <ProjectCodeContext.Provider value={() => {}}>
        <PyodideFallback error="worker failed" />
      </ProjectCodeContext.Provider>
    )
    expect(container.querySelector('a[href*="github"]')).toBeNull()
  })
})

describe('EngineErrorBanner code escape hatch', () => {
  it('offers the code CTA when rendered inside a project', () => {
    const openCode = vi.fn()
    render(
      <ProjectCodeContext.Provider value={openCode}>
        <EngineErrorBanner />
      </ProjectCodeContext.Provider>
    )

    fireEvent.click(
      screen.getByRole('button', { name: /view the engine code/i })
    )
    expect(openCode).toHaveBeenCalledTimes(1)
  })

  it('still explains the degraded state with no provider', () => {
    render(<EngineErrorBanner />)

    expect(screen.getByText(/live engine unavailable/i)).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
