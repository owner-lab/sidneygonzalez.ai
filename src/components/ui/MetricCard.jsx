import GlassPanel from './GlassPanel'

export default function MetricCard({
  label,
  value,
  change,
  changeType = 'neutral',
  children,
}) {
  const changeColors = {
    positive: 'text-impact-positive',
    negative: 'text-impact-negative',
    neutral: 'text-impact-neutral',
  }

  return (
    <GlassPanel className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span className="metric-value font-display text-2xl font-semibold text-text-primary">
        {value}
      </span>
      {change !== undefined && (
        <span className={`metric-value text-sm ${changeColors[changeType]}`}>
          {change}
        </span>
      )}
      {children}
    </GlassPanel>
  )
}
