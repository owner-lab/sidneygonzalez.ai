import { lazy, Suspense, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'
import GlassPanel from '@/components/ui/GlassPanel'
import PyodideStatus from '@/components/ui/PyodideStatus'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import PyodideFallback from '@/components/ui/PyodideFallback'
import usePyodide from '@/python/usePyodide'

// Lazy-load heavy project bundles (Recharts + Nivo ~226KB gzip) so initial
// paint is fast. Chunks are preloaded on idle so they're ready before scroll.
const CommandCenterProject = lazy(
  () => import('@/projects/command-center/CommandCenterProject')
)
const DecisionImpactProject = lazy(
  () => import('@/projects/decision-impact/DecisionImpactProject')
)
const VarianceEngineProject = lazy(
  () => import('@/projects/variance-engine/VarianceEngineProject')
)

function ProjectFallback({ title }) {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-blue" />
        Loading {title}…
      </div>
    </div>
  )
}

const STATUS_MAP = {
  idle: 'offline',
  loading: 'loading',
  ready: 'live',
  error: 'offline',
}

const STACK_ITEMS = [
  {
    number: '01',
    title: 'Command Center',
    subtitle: 'See the data',
    color: 'text-accent-blue',
    border: 'border-accent-blue/30',
  },
  {
    number: '02',
    title: 'Decision Analyzer',
    subtitle: 'Model the decision',
    color: 'text-accent-green',
    border: 'border-accent-green/30',
  },
  {
    number: '03',
    title: 'Variance Engine',
    subtitle: 'Find the anomaly',
    color: 'text-accent-red',
    border: 'border-accent-red/30',
  },
]

export default function Projects() {
  const { status, progress, progressLabel, error } = usePyodide()

  // Preload project chunks after initial paint so they're cached by the time
  // the user scrolls down. Uses requestIdleCallback with a setTimeout fallback.
  useEffect(() => {
    const preload = () => {
      import('@/projects/command-center/CommandCenterProject')
      import('@/projects/decision-impact/DecisionImpactProject')
      import('@/projects/variance-engine/VarianceEngineProject')
    }
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(preload, { timeout: 2000 })
      return () => window.cancelIdleCallback?.(id)
    }
    const id = setTimeout(preload, 600)
    return () => clearTimeout(id)
  }, [])

  return (
    <Section id="projects">
      <ScrollReveal>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-display-md font-semibold">
            Projects
          </h2>
          <PyodideStatus status={STATUS_MAP[status] || 'offline'} />
        </div>
        <p className="max-w-2xl text-text-secondary">
          Every project answers the same question: What is your company trying
          to tell you about the decisions you&apos;re making?
        </p>

        {/* Pyodide loading state */}
        {status === 'loading' && (
          <div className="mt-8">
            <LoadingSpinner progress={progress} label={progressLabel} />
          </div>
        )}

        {/* Pyodide error fallback */}
        {status === 'error' && (
          <div className="mt-8">
            <PyodideFallback error={error} />
          </div>
        )}
      </ScrollReveal>

      {/* Intelligence Stack diagram */}
      <ScrollReveal delay={0.2}>
        <div className="mb-12 mt-8">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-text-muted">
            Corporate Intelligence Stack
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {STACK_ITEMS.map((item) => (
              <GlassPanel
                key={item.number}
                className={`border ${item.border} text-center`}
              >
                <span className={`text-xs font-bold ${item.color}`}>
                  {item.number}
                </span>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {item.subtitle}
                </p>
              </GlassPanel>
            ))}
          </div>
          {/* Connectors (desktop only) */}
          <div className="mt-3 hidden items-center sm:flex">
            <div className="h-px flex-1 bg-gradient-to-r from-accent-blue/40 to-accent-green/40" />
            <span className="mx-3 text-[10px] text-text-muted">data flows →</span>
            <div className="h-px flex-1 bg-gradient-to-r from-accent-green/40 to-accent-red/40" />
          </div>
        </div>
      </ScrollReveal>

      {/* Project 1: Executive Command Center */}
      <Suspense fallback={<ProjectFallback title="Command Center" />}>
        <CommandCenterProject />
      </Suspense>

      {/* Project 2: Decision Impact Analyzer */}
      <Suspense fallback={<ProjectFallback title="Decision Impact Analyzer" />}>
        <DecisionImpactProject />
      </Suspense>

      {/* Project 3: Variance & Anomaly Engine */}
      <Suspense fallback={<ProjectFallback title="Variance Engine" />}>
        <VarianceEngineProject />
      </Suspense>

      {/* Bridge to the dedicated AI page — the three systems above are what
          AI-first automates; /ai puts a price on automating them. */}
      <ScrollReveal>
        <Link
          to="/ai"
          className="group mt-16 block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
        >
          <GlassPanel className="relative overflow-hidden border border-accent-purple/30 transition-colors group-hover:border-accent-purple/60">
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-60"
              style={{
                background:
                  'radial-gradient(120% 140% at 100% 0%, rgb(var(--accent-purple-ink) / 0.16), transparent 60%)',
              }}
              aria-hidden="true"
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <span className="text-xs font-semibold uppercase tracking-widest text-accent-ink-purple">
                  Dedicated page · The AI Value Test
                </span>
                <h3 className="mt-2 font-display text-display-sm font-semibold text-text-primary">
                  Prove the ROI on your AI investment.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  These three systems are what AI-first automates. The AI Value
                  Test is where the economics get decided — a manifesto plus a
                  live, risk-adjusted ROI model on IDC&apos;s 2026 framework.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-accent-purple/40 px-4 py-2 text-sm font-medium text-accent-ink-purple transition-transform group-hover:translate-x-0.5 sm:self-center">
                Take the test
                <span aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </GlassPanel>
        </Link>
      </ScrollReveal>
    </Section>
  )
}
