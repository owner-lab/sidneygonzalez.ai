import { useEffect, useRef, useState } from 'react'
import useIntersection from '@/hooks/useIntersection'

export default function AnimatedCounter({
  target,
  duration = 1.5,
  prefix = '',
  suffix = '',
  decimals = 0,
}) {
  const [count, setCount] = useState(0)
  const [ref, isVisible] = useIntersection({ threshold: 0.5 })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return
    hasAnimated.current = true

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReduced) {
      setCount(target)
      return
    }

    let start = 0
    const step = target / (duration * 60)
    const interval = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(interval)
      } else {
        setCount(start)
      }
    }, 1000 / 60)

    return () => clearInterval(interval)
  }, [isVisible, target, duration])

  return (
    <span ref={ref} className="metric-value font-display text-2xl font-semibold">
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  )
}
