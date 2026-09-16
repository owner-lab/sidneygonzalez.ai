import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExecutiveSummary from '@/projects/command-center/ExecutiveSummary'
import ProjectErrorBoundary from '@/components/ui/ProjectErrorBoundary'

// Regression cover for the blank-screen crash: a partial Pyodide result reached
// the formatters and threw `Cannot read properties of undefined (reading
// 'toFixed')` inside <ExecutiveSummary>. The throw was uncaught, so React
// unmounted the entire tree and the site went white — a direct violation of
// build principle #5 ("Never a blank screen").

describe('ExecutiveSummary with incomplete data', () => {
  it('renders a summary missing ebitda_margin without throwing', () => {
    const partial = {
      total_revenue: 423937057,
      ebitda: 125000000,
      // ebitda_margin deliberately absent — the reported crash input
      free_cash_flow: 55382026,
      ccc: 42,
      revenue_sparkline: [1, 2, 3],
      ebitda_sparkline: [1, 2, 3],
      fcf_sparkline: [1, 2, 3],
      ccc_sparkline: [1, 2, 3],
    }

    expect(() =>
      render(<ExecutiveSummary data={partial} loading={false} />)
    ).not.toThrow()

    // The revenue it does have still renders; the missing margin degrades.
    expect(screen.getByText('$423.9M')).toBeInTheDocument()
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0)
  })

  it('renders an entirely empty summary object without throwing', () => {
    // The shape `{...undefined}` used to produce: truthy, so it slipped past the
    // `!data` skeleton guard and straight into the formatters.
    expect(() =>
      render(<ExecutiveSummary data={{}} loading={false} />)
    ).not.toThrow()
  })

  it('shows the skeleton (not a crash) when data is absent', () => {
    const { container } = render(
      <ExecutiveSummary data={undefined} loading={false} />
    )
    expect(container.textContent).toContain('Loading')
  })

  it('does not print "undefined days" for a missing cash conversion cycle', () => {
    render(<ExecutiveSummary data={{ total_revenue: 1 }} loading={false} />)
    expect(screen.queryByText(/undefined/i)).toBeNull()
    expect(screen.queryByText(/NaN/)).toBeNull()
  })
})

describe('ProjectErrorBoundary', () => {
  let consoleError
  // jsdom re-dispatches the throw as a window error event and prints the stack,
  // which makes a passing suite look like a failing one.
  const swallow = (e) => e.preventDefault()

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.addEventListener('error', swallow)
  })

  afterEach(() => {
    window.removeEventListener('error', swallow)
    consoleError.mockRestore()
  })

  function Boom() {
    throw new TypeError("Cannot read properties of undefined (reading 'toFixed')")
  }

  it('contains a throw and renders the fallback instead of unmounting', () => {
    render(
      <div>
        <p>sibling content survives</p>
        <ProjectErrorBoundary name="Command Center">
          <Boom />
        </ProjectErrorBoundary>
      </div>
    )

    expect(screen.getByText(/live demo unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/Command Center could not be rendered/i)).toBeInTheDocument()
    // The rest of the page is still standing — the whole point.
    expect(screen.getByText('sibling content survives')).toBeInTheDocument()
  })

  it('renders children untouched when nothing throws', () => {
    render(
      <ProjectErrorBoundary name="Variance Engine">
        <p>chart rendered fine</p>
      </ProjectErrorBoundary>
    )
    expect(screen.getByText('chart rendered fine')).toBeInTheDocument()
  })
})
