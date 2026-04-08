import { useState } from 'react'
import GlassPanel from '@/components/ui/GlassPanel'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatVariance } from '@/utils/formatters'

const TYPE_BADGES = {
  trending_overspend: { label: 'Trending', color: 'red' },
  seasonal_spike: { label: 'Seasonal', color: 'orange' },
  threshold_cluster: { label: 'Threshold', color: 'purple' },
  duplicate_payment: { label: 'Duplicate', color: 'blue' },
  one_time_event: { label: 'One-Time', color: 'green' },
}

const ANOMALY_TYPES = [
  { key: 'All', label: 'All Types' },
  { key: 'trending_overspend', label: 'Trending' },
  { key: 'seasonal_spike', label: 'Seasonal' },
  { key: 'threshold_cluster', label: 'Threshold' },
  { key: 'duplicate_payment', label: 'Duplicate' },
  { key: 'one_time_event', label: 'One-Time' },
]

export default function AnomalyTable({ anomalies, anomalyType = 'All', onAnomalyTypeChange }) {
  const [expandedIdx, setExpandedIdx] = useState(null)

  if (!anomalies || anomalies.length === 0) return null

  const displayed = anomalyType === 'All'
    ? anomalies
    : anomalies.filter((a) => a.type === anomalyType)

  return (
    <GlassPanel className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Detected Anomalies
        </h4>
        <span className="text-xs text-text-muted">{displayed.length} flagged</span>
      </div>

      {onAnomalyTypeChange && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {ANOMALY_TYPES.map(({ key, label }) => (
            <Button
              key={key}
              variant={anomalyType === key ? 'secondary' : 'ghost'}
              className="text-xs"
              onClick={() => onAnomalyTypeChange(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      <div className="scroll-fade-right max-h-[400px] overflow-auto" data-lenis-prevent>
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-bg-secondary">
            <tr className="border-b border-border-subtle text-text-muted">
              <th className="pb-2 pr-3 font-medium">Type</th>
              <th className="pb-2 pr-3 font-medium">Department</th>
              <th className="hidden pb-2 pr-3 font-medium md:table-cell">Line Item</th>
              <th className="pb-2 pr-3 font-medium">Month</th>
              <th className="pb-2 pr-3 text-right font-medium">Variance</th>
              <th className="pb-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-text-muted">
                  No anomalies match this filter
                </td>
              </tr>
            ) : displayed.map((a, i) => {
              const badge = TYPE_BADGES[a.type] || { label: a.type, color: 'blue' }
              const isExpanded = expandedIdx === i

              return (
                <tr
                  key={`${a.department}-${a.line_item}-${a.month}-${i}`}
                  className="cursor-pointer border-b border-border-subtle/50 transition-colors hover:bg-bg-surface/30 last:border-0"
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                >
                  <td className="py-2 pr-3">
                    <Badge color={badge.color}>{badge.label}</Badge>
                  </td>
                  <td className="py-2 pr-3 text-text-secondary">{a.department}</td>
                  <td className="hidden py-2 pr-3 text-text-secondary md:table-cell">
                    {a.line_item}
                  </td>
                  <td className="py-2 pr-3 text-text-secondary">{a.month}</td>
                  <td className="metric-value py-2 pr-3 text-right text-text-primary">
                    {formatVariance(a.variance_abs)}
                  </td>
                  <td className={`metric-value py-2 text-right ${
                    a.variance_pct > 0 ? 'text-impact-negative' : 'text-impact-positive'
                  }`}>
                    {a.variance_pct > 0 ? '+' : ''}{a.variance_pct.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded explanation */}
      {expandedIdx !== null && displayed[expandedIdx] && (
        <div className="mt-3 rounded-lg bg-bg-surface/50 px-4 py-3">
          <p className="text-xs font-medium text-text-muted">
            {displayed[expandedIdx].line_item} — {displayed[expandedIdx].department}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            {displayed[expandedIdx].explanation}
          </p>
        </div>
      )}
    </GlassPanel>
  )
}
