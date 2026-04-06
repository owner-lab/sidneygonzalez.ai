import GlassPanel from '@/components/ui/GlassPanel'
import Badge from '@/components/ui/Badge'

const QUARTER_LABELS = {
  q1: { label: 'Q1', subtitle: 'Immediate (0-3 months)' },
  q2: { label: 'Q2', subtitle: 'Medium-term (3-6 months)' },
  q4: { label: 'Q4', subtitle: 'Full cascade (6-12 months)' },
}

function QuarterColumn({ quarterKey, kpis, kpiLabels }) {
  const { label, subtitle } = QUARTER_LABELS[quarterKey]
  // Only show KPIs new to this quarter (not already visible in prior quarter)
  return (
    <div className="flex-1">
      <div className="mb-3">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>
      {kpis.length === 0 ? (
        <p className="text-xs italic text-text-muted">No new effects</p>
      ) : (
        <div className="space-y-1.5">
          {kpis.map((kpi) => {
            const isPositive = kpi.change_pct > 0
            return (
              <div
                key={kpi.kpi}
                className="flex items-center justify-between rounded-md bg-bg-surface/50 px-2.5 py-1.5"
              >
                <span className="text-xs text-text-secondary">
                  {kpiLabels[kpi.kpi] || kpi.kpi}
                </span>
                <Badge color={isPositive ? 'green' : 'red'}>
                  {isPositive ? '+' : ''}{kpi.change_pct.toFixed(1)}%
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function QuarterlyBreakdown({ quarterly, kpiLabels }) {
  if (!quarterly) return null

  const hasData = ['q1', 'q2', 'q4'].some(
    (q) => quarterly[q] && quarterly[q].length > 0
  )
  if (!hasData) return null

  return (
    <GlassPanel>
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Timeline: When Effects Materialize
      </h4>
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        {['q1', 'q2', 'q4'].map((qKey) => (
          <QuarterColumn
            key={qKey}
            quarterKey={qKey}
            kpis={quarterly[qKey] || []}
            kpiLabels={kpiLabels}
          />
        ))}
      </div>
      {/* Timeline connector (desktop only) */}
      <div className="mt-4 hidden items-center gap-0 md:flex">
        <div className="h-0.5 flex-1 bg-gradient-to-r from-accent-blue to-accent-blue/50" />
        <span className="mx-2 text-[10px] text-text-muted">time →</span>
        <div className="h-0.5 flex-1 bg-gradient-to-r from-accent-blue/50 to-accent-blue/20" />
      </div>
    </GlassPanel>
  )
}
