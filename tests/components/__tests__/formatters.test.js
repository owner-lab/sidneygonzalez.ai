import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatPercent,
  formatVariance,
  formatCompact,
  formatCompactAccounting,
  formatCount,
  formatDate,
} from '../../../src/utils/formatters'

describe('formatCurrency', () => {
  it('formats positive numbers with $ and commas', () => {
    expect(formatCurrency(1234567)).toBe('$1,234,567')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })
})

describe('formatPercent', () => {
  it('formats with default 1 decimal', () => {
    expect(formatPercent(12.567)).toBe('12.6%')
  })

  it('formats with specified decimals', () => {
    expect(formatPercent(12.567, 2)).toBe('12.57%')
  })
})

describe('formatVariance', () => {
  it('formats positive values without parentheses', () => {
    expect(formatVariance(1234)).toBe('$1,234')
  })

  it('formats negative values with parentheses (accounting convention)', () => {
    expect(formatVariance(-1234)).toBe('($1,234)')
  })

  it('formats zero', () => {
    expect(formatVariance(0)).toBe('$0')
  })
})

describe('formatCompact', () => {
  it('formats millions', () => {
    expect(formatCompact(1200000)).toBe('$1.2M')
  })

  it('formats thousands', () => {
    expect(formatCompact(450000)).toBe('$450K')
  })

  it('formats small numbers', () => {
    expect(formatCompact(500)).toBe('$500')
  })
})

// These formatters render inside Pyodide-backed components. A partial or failed
// engine result must degrade to a dash — a throw here unmounts the whole React
// tree and blanks the site (build principle #5), and "$NaN" is just as broken to
// a CFO reading the page.
describe('missing-value handling', () => {
  const cases = [
    ['formatCurrency', formatCurrency],
    ['formatPercent', formatPercent],
    ['formatVariance', formatVariance],
    ['formatCompact', formatCompact],
    ['formatCompactAccounting', formatCompactAccounting],
    ['formatCount', formatCount],
  ]

  for (const [name, fn] of cases) {
    it(`${name} returns a dash and never throws for missing values`, () => {
      for (const bad of [undefined, null, NaN, Infinity, -Infinity]) {
        expect(() => fn(bad)).not.toThrow()
        expect(fn(bad)).toBe('—')
      }
    })
  }

  it('formatPercent survives the exact reported crash input', () => {
    // TypeError: Cannot read properties of undefined (reading 'toFixed')
    const summaryMissingMargin = { total_revenue: 1000 }
    expect(() => formatPercent(summaryMissingMargin.ebitda_margin)).not.toThrow()
    expect(formatPercent(summaryMissingMargin.ebitda_margin)).toBe('—')
  })

  it('formatDate returns a dash for an unparseable date', () => {
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('still formats zero rather than treating it as missing', () => {
    expect(formatPercent(0)).toBe('0.0%')
    expect(formatCompact(0)).toBe('$0')
    expect(formatCount(0)).toBe('0')
    expect(formatCurrency(0)).toBe('$0')
  })
})
