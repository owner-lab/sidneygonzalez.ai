import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { useLenis } from 'lenis/react'

const HEADER_OFFSET = -80
const MAX_HASH_TRIES = 20

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

    const scrollToHash = () => {
      if (cancelled) return
      const el = document.querySelector(hash)
      if (el) {
        lenis.scrollTo(el, { offset: HEADER_OFFSET })
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
