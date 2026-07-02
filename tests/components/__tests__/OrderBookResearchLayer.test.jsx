import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StressPanel from '@/projects/order-book/StressPanel'
import HeadcountRoiPanel from '@/projects/order-book/HeadcountRoiPanel'
import { PRESETS, FALLBACK_RESULT } from '@/projects/order-book/fallbackData'

// The research-driven layer (Kangasluoma 2016): book-coverage runway, operating profit
// net of fixed overhead, and the downturn stress comparison. These guard the fields the
// engine emits and the StressPanel component that previously had no tests.
describe('Order Book — research layer (coverage, operating profit, stress)', () => {
  const byId = Object.fromEntries(PRESETS.map((p) => [p.id, p.result]))
  const horizon = FALLBACK_RESULT.summary.horizon_months

  // --- Coverage runway regression -------------------------------------------------
  // The bug: averaging revenue over the full horizon (incl. idle months after the book
  // clears) pegged EVERY book at the horizon length — a $290K shop and a $29M book both
  // reported "18.0 mo". Coverage must instead track each book's real delivery span.
  it('coverage runway tracks each book\'s real delivery span, never pegged at the horizon', () => {
    const small = byId.small_shop.summary.coverage_months_now
    expect(small).toBeGreaterThan(0)
    expect(small).toBeLessThan(horizon) // the bug returned exactly the horizon (18.0)
    expect(small).toBeLessThanOrEqual(10) // small shop clears in ~7 active months

    // Differently-sized books must not collapse to the same coverage number.
    expect(byId.small_shop.summary.coverage_months_now).not.toBe(
      byId.manufacturer.summary.coverage_months_now
    )

    // Invariant: for any book that fully clears in-horizon, coverage == active months.
    for (const id of ['services', 'small_shop', 'starter']) {
      const r = byId[id]
      const active = r.timeline.filter((e) => e.realized + e.at_risk > 0).length
      const clears = r.timeline[r.timeline.length - 1].backlog_value < 1
      if (clears) {
        expect(Math.abs(r.summary.coverage_months_now - active)).toBeLessThanOrEqual(1)
      }
    }
  })

  // --- StressPanel (previously zero coverage) -------------------------------------
  const stressComparison = {
    base_recognized: 5_659_400,
    base_op_profit: 2_959_400,
    stress_recognized: 4_382_953,
    stress_op_profit: 1_682_953,
    revenue_delta_pct: -22.6,
    op_profit_delta_pct: -43.1,
    amplification: 1.91,
    stress_backlog_applied_pct: -20.86,
    benchmark_backlog_delta_pct: -20.86,
    benchmark_revenue_delta_pct: -13.33,
    benchmark_op_profit_delta_pct: -35.4,
    benchmark_amplification: 2.66,
  }

  it('StressPanel renders the amplification metric and the benchmark comparison', () => {
    const { container } = render(<StressPanel stressComparison={stressComparison} />)
    expect(screen.getByText('Downturn Stress Analysis')).toBeInTheDocument()
    expect(screen.getByText('Fixed-cost amplification')).toBeInTheDocument()
    expect(screen.getByText('1.91×')).toBeInTheDocument() // computed amplification
    expect(screen.getByText('Operating profit impact')).toBeInTheDocument() // fixed-cost path
    // Embedded numbers/wording — assert against full text content (robust to node splits).
    expect(container.textContent).toMatch(/more resilient/i) // 1.91× < 2.66× benchmark
    expect(container.textContent).toMatch(/2\.66×/) // published benchmark amplification
    expect(container.textContent).toMatch(/20\.86%/) // measured backlog contraction
  })

  it('StressPanel renders nothing without a stress comparison (never a blank box)', () => {
    const { container } = render(<StressPanel stressComparison={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  // --- Coverage + operating profit surface in the summary strip -------------------
  it('HeadcountRoiPanel surfaces the coverage runway and operating profit metrics', () => {
    render(<HeadcountRoiPanel result={FALLBACK_RESULT} flashKey={0} />)
    expect(screen.getByText('Coverage runway')).toBeInTheDocument()
    // Manufacturer fallback carries $150K/mo overhead -> operating profit metric appears.
    expect(screen.getByText(/Op\. profit/i)).toBeInTheDocument()
  })
})
