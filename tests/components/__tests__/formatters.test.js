import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatPercent,
  formatVariance,
  formatCompact,
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
