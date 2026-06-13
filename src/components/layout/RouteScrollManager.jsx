import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { useLenis } from 'lenis/react'

const HEADER_OFFSET = -80
const MAX_HASH_TRIES = 20
// How long to keep a hash target pinned as the page settles after arrival.
// Covers Pyodide's documented 3–8s cold-load (see Build Log): the live demos
// keep growing the layout until they finish rendering, so a short window can
// disconnect before the last shift. Any user scroll bails it early, so a
// generous ceiling is cheap.
const SETTLE_MS = 8000

// Per-entry scroll positions, keyed by history entry (location.key). Module-level
// so it survives Layout/StrictMode remounts and persists for the whole session.
const scrollPositions = new Map()

// Drives scroll + focus across client-route changes. Rendered INSIDE <ReactLenis>
// (useLenis needs that context) and renders nothing. Behavior:
//   • forward nav (PUSH/REPLACE), no hash  → reset to top
//   • any nav with a hash                  → scroll to the section once it mounts
//     (also fires on first mount, so cold deep-links like /#contact via the SPA
//      fallback land correctly)
//   • back/forward (POP)                   → restore the saved scroll position
// All effects are StrictMode-idempotent: rAFs are cancelled in cleanup and a
// `cancelled` flag guards the retry loop.
export default function RouteScrollManager() {
  const lenis = useLenis()
  const { pathname, hash, key } = useLocation()
  const navType = useNavigationType()
  const hasMounted = useRef(false)

  // Continuously record the scroll position for the active history entry so a
  // later POP to it can be restored. The cleanup captures a final value at the
  // moment the entry changes (before the new route scrolls).
  useEffect(() => {
    const save = () => scrollPositions.set(key, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })
    return () => {
      save()
      window.removeEventListener('scroll', save)
    }
  }, [key])

  // Scroll behavior on navigation.
  useEffect(() => {
    if (!lenis) return
    let cancelled = false
    let rafScroll
    let rafHash
    let tries = 0
    let stopSettle = null

    // Keep the hash target pinned while the page settles. Home re-mounts fresh
    // and lazy-loads its project chunks + Pyodide demos AFTER this scroll,
    // growing the layout by thousands of px ABOVE the target — so a one-shot
    // scroll lands far short (ask for /#contact, get parked at an earlier
    // section). Re-pin on each body resize for a bounded window, and bail the
    // instant the user scrolls so we never fight them.
    const pinUntilSettled = (el) => {
      // Immediate (not smooth): a cross-route hash should place instantly, like
      // a native anchor jump — and an instant placement can't be interrupted by
      // a re-pin mid-animation. The target then stays visually fixed while the
      // lazy content loads ABOVE it (off-screen), so the user never sees it move.
      lenis.scrollTo(el, { offset: HEADER_OFFSET, immediate: true })

      const interactions = ['wheel', 'touchstart', 'keydown', 'pointerdown']
      let firstObservation = true
      let ro
      let timer
      const stop = () => {
        ro?.disconnect()
        clearTimeout(timer)
        interactions.forEach((e) => window.removeEventListener(e, stop))
      }
      ro = new ResizeObserver(() => {
        // skip the synchronous initial callback (reports current size, no change)
        if (firstObservation) {
          firstObservation = false
          return
        }
        if (!cancelled) {
          lenis.scrollTo(el, { offset: HEADER_OFFSET, immediate: true })
        }
      })
      // Observe <body>, whose box grows with content (it's what makes the page
      // scroll). NOT <html>, whose box tracks the viewport and wouldn't fire on
      // below-the-fold growth.
      ro.observe(document.body)
      interactions.forEach((e) =>
        window.addEventListener(e, stop, { passive: true })
      )
      timer = setTimeout(stop, SETTLE_MS)
      return stop
    }

    const scrollToHash = () => {
      if (cancelled) return
      const el = document.querySelector(hash)
      if (el) {
        stopSettle = pinUntilSettled(el)
      } else if (tries < MAX_HASH_TRIES) {
        tries += 1
        rafHash = requestAnimationFrame(scrollToHash) // section may still be mounting
      }
    }

    if (navType === 'POP' && scrollPositions.has(key)) {
      const y = scrollPositions.get(key)
      rafScroll = requestAnimationFrame(() => {
        if (!cancelled) lenis.scrollTo(y, { immediate: true })
      })
    } else if (hash) {
      rafScroll = requestAnimationFrame(scrollToHash)
    } else {
      lenis.scrollTo(0, { immediate: true })
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(rafScroll)
      cancelAnimationFrame(rafHash)
      stopSettle?.()
    }
  }, [pathname, hash, key, navType, lenis])

  // Move focus to <main> on forward navigation to a new page (a11y), but not on
  // first mount, not on back/forward, and not for in-page hash jumps.
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    if (navType === 'POP' || hash) return
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [pathname, hash, navType])

  return null
}
