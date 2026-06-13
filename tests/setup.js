import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom implements none of these; any test that renders Navbar (matchMedia via
// useTheme/useMediaQuery, IntersectionObserver via the scrollspy) or the model's
// charts (ResizeObserver) throws on mount without them.

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(), // deprecated, some libs still call it
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// Records observe/disconnect so the scrollspy re-observe regression test can
// assert it re-subscribes after a /→/ai→/ round-trip.
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback
    this.options = options
    this.observed = new Set()
    MockIntersectionObserver.instances.push(this)
  }
  observe(el) {
    this.observed.add(el)
    MockIntersectionObserver.observeCount += 1
  }
  unobserve(el) {
    this.observed.delete(el)
  }
  disconnect() {
    this.observed.clear()
    MockIntersectionObserver.disconnectCount += 1
  }
  takeRecords() {
    return []
  }
}
MockIntersectionObserver.instances = []
MockIntersectionObserver.observeCount = 0
MockIntersectionObserver.disconnectCount = 0
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', MockResizeObserver)
