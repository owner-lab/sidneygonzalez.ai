import { useLenis } from 'lenis/react'
import { useCallback } from 'react'

// Projects and their heavy chart bundles are lazy — a hash target can be absent
// for a beat after mount (Suspense fallback showing, chunk still in flight).
// lenis.scrollTo() silently no-ops on a missing selector, so wait for the node
// to appear before scrolling instead of dropping the interaction.
const WAIT_MS = 2500

function whenPresent(selector, cb) {
  if (document.querySelector(selector)) return cb()

  const deadline = performance.now() + WAIT_MS
  const poll = () => {
    if (document.querySelector(selector)) return cb()
    if (performance.now() < deadline) requestAnimationFrame(poll)
  }
  requestAnimationFrame(poll)
}

export default function useLenisScroll() {
  const lenis = useLenis()

  const scrollTo = useCallback(
    (target, options = {}) => {
      if (!lenis) return

      const run = () =>
        lenis.scrollTo(target, {
          offset: options.offset ?? -80,
          duration: options.duration ?? 1.2,
          easing: options.easing ?? ((t) => Math.min(1, 1.001 - 2 ** (-10 * t))),
          ...options,
        })

      if (typeof target === 'string' && target.startsWith('#')) {
        whenPresent(target, run)
      } else {
        run()
      }
    },
    [lenis]
  )

  return scrollTo
}
