import GlassPanel from '@/components/ui/GlassPanel'
import Badge from '@/components/ui/Badge'

function formatValue(baseline, unit) {
  if (unit === 'millions_usd') return `$${baseline}M`
  if (unit === 'thousands_usd') return `$${baseline}K`
  if (unit === 'usd') return `$${baseline.toLocaleString()}`
  if (unit === 'percent') return `${baseline}%`
  if (unit === 'days') return `${baseline}d`
  if (unit === 'count') return baseline.toLocaleString()
  if (unit === 'score') return baseline.toString()
  if (unit === 'score_1_5') return baseline.toFixed(1)
  if (unit === 'index_0_100') return baseline.toString()
  return baseline.toString()
}

export default function CascadeTable({ cascade, kpiLabels, kpiUnits }) {
  if (!cascade || cascade.length === 0) return null

  return (
    <GlassPanel>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Impact Cascade
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-text-muted">
              <th className="pb-2 pr-3 font-medium">KPI</th>
              <th className="pb-2 pr-3 text-right font-medium">Baseline</th>
              <th className="pb-2 pr-3 text-center font-medium"></th>
              <th className="pb-2 pr-3 text-right font-medium">Projected</th>
              <th className="pb-2 pr-3 text-right font-medium">Change</th>
              <th className="pb-2 text-right font-medium">Lag</th>
            </tr>
          </thead>
          <tbody>
            {cascade.map((item, i) => {
              const isPositive = item.change_pct > 0
              const isNegative = item.change_pct < 0
              const unit = kpiUnits[item.kpi] || ''

              return (
                <tr
                  key={item.kpi}
                  className="border-b border-border-subtle/50 last:border-0"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <td className="py-2 pr-3 font-medium text-text-primary">
                    {kpiLabels[item.kpi] || item.kpi}
                  </td>
                  <td className="metric-value py-2 pr-3 text-right text-text-secondary">
                    {formatValue(item.baseline, unit)}
                  </td>
                  <td className="py-2 pr-3 text-center text-text-muted">→</td>
                  <td className="metric-value py-2 pr-3 text-right text-text-primary">
                    {formatValue(item.projected, unit)}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <Badge
                      color={isPositive ? 'green' : isNegative ? 'red' : 'blue'}
                    >
                      {isPositive ? '+' : ''}
                      {item.change_pct.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="metric-value py-2 text-right text-text-muted">
                    {item.lag_months > 0 ? `${item.lag_months}mo` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  )
}
