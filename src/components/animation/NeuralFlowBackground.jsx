import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import useIsDark from '@/hooks/useIsDark'

// Luminous / neural signature background for /ai. A static purple-weighted
// radial mesh is always present; on top, a soft drifting particle graph evokes
// a neural network. The canvas loop is branched OUT entirely under reduced
// motion (the global CSS rule can't stop a JS rAF loop), capped in particle
// count, and paused when the tab is hidden or the canvas scrolls off-screen.
export default function NeuralFlowBackground({ className = '' }) {
  const reduced = useReducedMotion()
  const isDark = useIsDark()
  const canvasRef = useRef(null)

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return // jsdom / unsupported — static mesh still shows

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rgb = isDark ? '167, 139, 250' : '120, 86, 220'
    const LINK_DIST = 140
    const SPEED = 0.18

    let width = 0
    let height = 0
    let nodes = []
    let rafId = null
    let pageVisible = !document.hidden
    let onScreen = true

    const build = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(46, Math.max(14, Math.round((width * height) / 30000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: Math.random() * 1.4 + 0.8,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > width) n.vx *= -1
        if (n.y < 0 || n.y > height) n.vy *= -1
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j]
          const dx = n.x - m.x
          const dy = n.y - m.y
          const dist = Math.hypot(dx, dy)
          if (dist < LINK_DIST) {
            ctx.strokeStyle = `rgba(${rgb}, ${(1 - dist / LINK_DIST) * (isDark ? 0.22 : 0.16)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(n.x, n.y)
            ctx.lineTo(m.x, m.y)
            ctx.stroke()
          }
        }
      }
      ctx.fillStyle = `rgba(${rgb}, ${isDark ? 0.5 : 0.4})`
      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }
      rafId = requestAnimationFrame(draw)
    }

    const start = () => {
      if (rafId == null && pageVisible && onScreen) rafId = requestAnimationFrame(draw)
    }
    const stop = () => {
      if (rafId != null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    build()
    start()

    const onResize = () => build()
    const onVisibility = () => {
      pageVisible = !document.hidden
      pageVisible ? start() : stop()
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        onScreen ? start() : stop()
      },
      { threshold: 0 }
    )
    io.observe(canvas)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      io.disconnect()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced, isDark])

  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Static purple-weighted mesh — always present, and the only layer under reduced motion. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isDark ? 1 : 0.75,
          background: `
            radial-gradient(60% 55% at 15% 8%, rgba(167, 139, 250, ${isDark ? 0.2 : 0.11}) 0%, transparent 60%),
            radial-gradient(50% 45% at 88% 18%, rgba(0, 104, 255, ${isDark ? 0.13 : 0.06}) 0%, transparent 55%),
            radial-gradient(55% 50% at 72% 92%, rgba(167, 139, 250, ${isDark ? 0.15 : 0.08}) 0%, transparent 60%)
          `,
        }}
      />
      {!reduced && <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />}
    </div>
  )
}
