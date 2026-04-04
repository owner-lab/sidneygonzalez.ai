import { formatVariance } from '@/utils/formatters'

export default function VarianceIndicator({ value, threshold = 0 }) {
  const isPositive = value > threshold
  const isNeutral = value === threshold
  const color = isNeutral
    ? 'text-impact-neutral'
    : isPositive
      ? 'text-impact-positive'
      : 'text-impact-negative'
  const arrow = isNeutral ? '~' : isPositive ? '\u25B2' : '\u25BC'

  return (
    <span className={`inline-flex items-center gap-1 text-sm ${color}`}>
      <span>{arrow}</span>
      <span className="metric-value">{formatVariance(value)}</span>
    </span>
  )
}
