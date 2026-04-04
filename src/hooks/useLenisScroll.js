import { useLenis } from 'lenis/react'
import { useCallback } from 'react'

export default function useLenisScroll() {
  const lenis = useLenis()

  const scrollTo = useCallback(
    (target, options = {}) => {
      if (lenis) {
        lenis.scrollTo(target, {
          offset: options.offset ?? -80,
          duration: options.duration ?? 1.2,
          easing: options.easing ?? ((t) => Math.min(1, 1.001 - 2 ** (-10 * t))),
          ...options,
        })
      }
    },
    [lenis]
  )

  return scrollTo
}
