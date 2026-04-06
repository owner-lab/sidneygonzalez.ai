import GlassPanel from '@/components/ui/GlassPanel'

export default function ExecutiveNarrative({ narrative, scenarioLabel }) {
  if (!narrative) return null

  return (
    <GlassPanel className="mt-6">
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Executive Analysis
      </h4>
      {scenarioLabel && (
        <p className="mb-3 text-sm font-medium text-text-primary">
          {scenarioLabel}
        </p>
      )}
      <p className="text-sm leading-relaxed text-text-secondary">{narrative}</p>
    </GlassPanel>
  )
}
