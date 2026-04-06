import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'
import PyodideStatus from '@/components/ui/PyodideStatus'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import PyodideFallback from '@/components/ui/PyodideFallback'
import usePyodide from '@/python/usePyodide'
import CommandCenterProject from '@/projects/command-center/CommandCenterProject'
import DecisionImpactProject from '@/projects/decision-impact/DecisionImpactProject'
import VarianceEngineProject from '@/projects/variance-engine/VarianceEngineProject'

const STATUS_MAP = {
  idle: 'offline',
  loading: 'loading',
  ready: 'live',
  error: 'offline',
}

export default function Projects() {
  const { status, progress, progressLabel, error } = usePyodide()

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

      {/* Project 1: Executive Command Center */}
      <CommandCenterProject />

      {/* Project 2: Decision Impact Analyzer */}
      <DecisionImpactProject />

      {/* Project 3: Variance & Anomaly Engine */}
      <VarianceEngineProject />
    </Section>
  )
}
