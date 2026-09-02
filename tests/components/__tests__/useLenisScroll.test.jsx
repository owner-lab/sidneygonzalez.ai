import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Stub the Lenis instance the hook consumes.
const scrollToSpy = vi.fn()
vi.mock('lenis/react', () => ({
  useLenis: () => ({ scrollTo: scrollToSpy }),
}))

const { default: useLenisScroll } = await import('@/hooks/useLenisScroll')

// Projects and their chart bundles are lazy, so a hash target can be absent for
// a beat after mount. lenis.scrollTo() silently no-ops on a missing selector —
// these pin that the hook waits for the node instead of dropping the scroll.
describe('useLenisScroll', () => {
  beforeEach(() => {
    scrollToSpy.mockClear()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('scrolls immediately when the target already exists', () => {
    document.body.innerHTML = '<div id="order-book"></div>'
    const { result } = renderHook(() => useLenisScroll())

    result.current('#order-book')

    expect(scrollToSpy).toHaveBeenCalledTimes(1)
    expect(scrollToSpy.mock.calls[0][0]).toBe('#order-book')
  })

  it('defers the scroll until a lazy target appears', async () => {
    const { result } = renderHook(() => useLenisScroll())

    result.current('#variance-engine')
    expect(scrollToSpy).not.toHaveBeenCalled()

    // Suspense resolves and the section mounts.
    const el = document.createElement('div')
    el.id = 'variance-engine'
    document.body.appendChild(el)

    await vi.waitFor(() => expect(scrollToSpy).toHaveBeenCalledTimes(1))
    expect(scrollToSpy.mock.calls[0][0]).toBe('#variance-engine')
  })

  it('passes non-selector targets straight through', () => {
    const { result } = renderHook(() => useLenisScroll())

    result.current(1200)

    expect(scrollToSpy).toHaveBeenCalledTimes(1)
    expect(scrollToSpy.mock.calls[0][0]).toBe(1200)
  })

  it('applies the shared navbar offset by default', () => {
    document.body.innerHTML = '<div id="command-center"></div>'
    const { result } = renderHook(() => useLenisScroll())

    result.current('#command-center')

    expect(scrollToSpy.mock.calls[0][1].offset).toBe(-80)
  })
})
