import GlassPanel from '@/components/ui/GlassPanel'
import MetricCard from '@/components/ui/MetricCard'
import Badge from '@/components/ui/Badge'
import { formatCompact, formatPercent, formatVariance } from '@/utils/formatters'

function BreakEvenCard({ result }) {
  const { break_even_feasible, break_even_probability, success_probability } = result

  if (!break_even_feasible || break_even_probability == null) {
    return (
      <MetricCard
        label="Break-even ship odds"
        value="—"
        change="Can't break even at these costs"
        changeType="negative"
      />
    )
  }

  const hasMargin = break_even_probability < success_probability
  return (
    <MetricCard
      label="Break-even ship odds"
      value={formatPercent(break_even_probability * 100, 0)}
      change={
        hasMargin
          ? `Below your ${formatPercent(success_probability * 100, 0)} — has margin`
          : `Above your ${formatPercent(success_probability * 100, 0)} — at risk`
      }
      changeType={hasMargin ? 'positive' : 'negative'}
    />
  )
}

function ContributionTable({ perBenefit }) {
  if (!perBenefit || perBenefit.length === 0) return null

  return (
    <GlassPanel>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Value Contribution by Benefit
      </h4>
      <div className="overflow-x-auto" data-lenis-prevent>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-text-muted">
              <th className="pb-2 pr-3 font-medium">Benefit</th>
              <th className="pb-2 pr-3 text-right font-medium">Direct</th>
              <th className="pb-2 pr-3 text-right font-medium">Indirect</th>
              <th className="pb-2 pr-3 text-right font-medium">Annual</th>
              <th className="pb-2 text-right font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {perBenefit.map((b) => (
              <tr key={b.id} className="border-b border-border-subtle/50 last:border-0">
                <td className="py-2 pr-3 font-medium text-text-primary">{b.name}</td>
                <td className="metric-value py-2 pr-3 text-right text-text-secondary">
                  {formatCompact(b.direct)}
                </td>
                <td className="metric-value py-2 pr-3 text-right text-text-secondary">
                  {formatCompact(b.indirect)}
                </td>
                <td className="metric-value py-2 pr-3 text-right text-text-primary">
                  {formatCompact(b.annual_value)}
                </td>
                <td className="py-2 text-right">
                  <Badge color="blue">{b.share_pct.toFixed(1)}%</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  )
}

function SensitivityTornado({ sensitivity, base }) {
  if (!sensitivity || sensitivity.length === 0) return null

  const lows = sensitivity.map((s) => s.low)
  const highs = sensitivity.map((s) => s.high)
  const domainMin = Math.min(...lows, base)
  const domainMax = Math.max(...highs, base)
  const range = domainMax - domainMin || 1
  const basePct = ((base - domainMin) / range) * 100

  return (
    <GlassPanel>
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
        What moves the ROI most
      </h4>
      <p className="mb-4 text-xs text-text-muted">
        ROI swing if each driver alone moves ±20%. The longest bar is the assumption your
        business case depends on most. Dashed line = current ROI ({formatPercent(base, 0)}).
      </p>

      <div className="flex flex-col gap-3">
        {sensitivity.map((s) => {
          const leftPct = ((s.low - domainMin) / range) * 100
          const widthPct = Math.max(((s.high - s.low) / range) * 100, 1.5)
          return (
            <div key={s.factor} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-text-secondary">{s.factor}</span>
              <div className="relative h-6 flex-1 rounded bg-bg-hover/50">
                {/* current-ROI reference line */}
                <div
                  className="absolute top-0 h-full w-px bg-text-muted/50"
                  style={{ left: `${basePct}%` }}
                  aria-hidden="true"
                />
                {/* swing bar */}
                <div
                  className="absolute top-1/2 h-3 -translate-y-1/2 rounded bg-accent-blue/70"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`${formatPercent(s.low, 0)} → ${formatPercent(s.high, 0)}`}
                />
              </div>
              <span className="metric-value w-24 shrink-0 text-right text-[11px] tabular-nums text-text-muted">
                {formatPercent(s.low, 0)} / {formatPercent(s.high, 0)}
              </span>
            </div>
          )
        })}
      </div>
    </GlassPanel>
  )
}

export default function RoiResults({ result, flashKey }) {
  if (!result) return null

  const roiPositive = result.roi_pct >= 0
  const netPositive = result.net_value >= 0

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Headline metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Risk-adjusted ROI"
          value={
            <span key={flashKey} className="data-flash">
              {roiPositive ? '+' : ''}
              {formatPercent(result.roi_pct, 0)}
            </span>
          }
          change={`${result.risk_adjusted_multiple.toFixed(2)}× return on cost`}
          changeType={roiPositive ? 'positive' : 'negative'}
        />
        <MetricCard
          label="AI business value income"
          value={formatCompact(result.value_income)}
          change={`${formatCompact(result.annual_value_income)}/yr × ${result.years}y`}
          changeType="neutral"
        />
        <MetricCard
          label="Net value (risk-adjusted)"
          value={
            <span className={netPositive ? 'text-impact-positive' : 'text-impact-negative'}>
              {formatVariance(result.net_value)}
            </span>
          }
          change={
            result.payback_years != null
              ? `Payback ~${result.payback_years} yrs`
              : `Over ${result.years}-yr horizon`
          }
          changeType={netPositive ? 'positive' : 'negative'}
        />
        <BreakEvenCard result={result} />
      </div>

      {/* Raw vs risk-adjusted — makes IDC's success-probability multiplier explicit */}
      <GlassPanel>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            IDC adjustment
          </span>
          <span className="metric-value tabular-nums text-text-primary">
            {result.raw_multiple.toFixed(2)}×
          </span>
          <span className="text-text-muted">unadjusted</span>
          <span className="text-text-muted">→ ×{formatPercent(result.success_probability * 100, 0)} success →</span>
          <span className="metric-value tabular-nums text-text-primary">
            {result.risk_adjusted_multiple.toFixed(2)}×
          </span>
          <span className="text-text-muted">risk-adjusted</span>
        </div>
      </GlassPanel>

      <ContributionTable perBenefit={result.per_benefit} />
      <SensitivityTornado sensitivity={result.sensitivity} base={result.roi_pct} />
    </div>
  )
}
