import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Slider from '@/components/ui/Slider'

// The fill bar is the only absolute div with both an inline left AND width.
function getFill(container) {
  return [...container.querySelectorAll('div')].find(
    (el) => el.style.left !== '' && el.style.width !== ''
  )
}

describe('Slider fill', () => {
  it('does not overflow left when the range excludes zero (min > 0)', () => {
    const { container } = render(
      <Slider label="Time horizon" value={5} min={1} max={7} onChange={() => {}} />
    )
    const fill = getFill(container)
    // regression: previously left was -16.7% (fill started off the track)
    expect(parseFloat(fill.style.left)).toBeGreaterThanOrEqual(0)
    expect(parseFloat(fill.style.width)).toBeLessThanOrEqual(100)
    expect(parseFloat(fill.style.width)).toBeCloseTo(66.67, 0)
  })

  it('fills from the left edge for a standard 0..100 range', () => {
    const { container } = render(
      <Slider label="Direct value share" value={60} min={0} max={100} onChange={() => {}} />
    )
    const fill = getFill(container)
    expect(parseFloat(fill.style.left)).toBe(0)
    expect(parseFloat(fill.style.width)).toBeCloseTo(60, 0)
  })

  it('keeps an in-range zero origin for bipolar ranges (min < 0)', () => {
    const { container } = render(
      <Slider label="Variance" value={-30} min={-100} max={100} onChange={() => {}} />
    )
    const fill = getFill(container)
    // zero sits at 50%; thumb at 35% → fill spans 35%..50%
    expect(parseFloat(fill.style.left)).toBeCloseTo(35, 0)
    expect(parseFloat(fill.style.width)).toBeCloseTo(15, 0)
  })
})
