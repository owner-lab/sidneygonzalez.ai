import GlassPanel from '@/components/ui/GlassPanel'
import MetricCard from '@/components/ui/MetricCard'
import Badge from '@/components/ui/Badge'
import {
  formatCompact,
  formatCompactAccounting,
  formatPercent,
  formatRoiPercent,
  formatMultiple,
} from '@/utils/formatters'

// Sensible payback text for any magnitude (avoids "~0 yrs" / off-scale values).
function formatPayback(years) {
  if (years == null || !Number.isFinite(years)) return null
  if (years < 1 / 12) return 'Payback < 1 mo'
  if (years < 1) return `Payback ~${Math.round(years * 12)} mo`
  if (years > 50) return 'Payback > 50 yrs'
  return `Payback ~${years.toFixed(1)} yrs`
}

function BreakEvenCard({ result }) {
  const { cost_valid, break_even_feasible, break_even_probability, success_probability } =
    result

  if (!cost_valid) {
    return (
      <MetricCard
        label="Break-even ship odds"
        value="—"
        change="Add a cost to compute"
        changeType="neutral"
      />
    )
  }

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

// Re-keying a node by `flashKey` remounts it, replaying the one-shot `data-flash`
// CSS pulse. flashKey ticks once per settled adjustment (see AiValueModel), so
// each value pulses green when the model recomputes — visible proof the table is
// live, even where a figure (Share %) is mathematically unchanged by the input.
function Flash({ flashKey, className = '', children }) {
  return (
    <span key={flashKey} className={`data-flash inline-block rounded ${className}`}>
      {children}
    </span>
  )
}

function ContributionTable({ perBenefit, flashKey }) {
  if (!perBenefit || perBenefit.length === 0) return null

  return (
    <GlassPanel>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Value Contribution by Benefit
        </h4>
        <span
          key={flashKey}
          className="data-flash inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-accent-ink-green"
          title="Recomputed live in Python on every input change"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-green" aria-hidden="true" />
          Recalculated
        </span>
      </div>
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
                  <Flash flashKey={flashKey} className="px-1">{formatCompact(b.direct)}</Flash>
                </td>
                <td className="metric-value py-2 pr-3 text-right text-text-secondary">
                  <Flash flashKey={flashKey} className="px-1">{formatCompact(b.indirect)}</Flash>
                </td>
                <td className="metric-value py-2 pr-3 text-right text-text-primary">
                  <Flash flashKey={flashKey} className="px-1">{formatCompact(b.annual_value)}</Flash>
                </td>
                <td className="py-2 text-right">
                  <Flash flashKey={flashKey}>
                    <Badge color="blue">{b.share_pct.toFixed(1)}%</Badge>
                  </Flash>
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
  if (!sensitivity || sensitivity.length === 0) {
    return (
      <GlassPanel>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
          What moves the ROI most
        </h4>
        <p className="text-xs text-text-muted">
          Enter a positive cost to see which assumption the business case depends on most.
        </p>
      </GlassPanel>
    )
  }

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
        business case depends on most. Dashed line = current ROI ({formatRoiPercent(base)}).
      </p>

      <div className="flex flex-col gap-3">
        {sensitivity.map((s) => {
          const leftPct = ((s.low - domainMin) / range) * 100
          const widthPct = Math.max(((s.high - s.low) / range) * 100, 1.5)
          return (
            <div key={s.factor} className="flex items-center gap-2 sm:gap-3">
              <span className="w-24 shrink-0 text-[11px] text-text-secondary sm:w-28 sm:text-xs">
                {s.factor}
              </span>
              <div className="relative h-6 flex-1 rounded bg-bg-hover/50">
                <div
                  className="absolute top-0 h-full w-px bg-text-muted/50"
                  style={{ left: `${basePct}%` }}
                  aria-hidden="true"
                />
                <div
                  className="absolute top-1/2 h-3 -translate-y-1/2 rounded bg-accent-blue/70"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`${formatRoiPercent(s.low)} → ${formatRoiPercent(s.high)}`}
                />
              </div>
              <span className="metric-value w-20 shrink-0 text-right text-[10px] tabular-nums text-text-muted sm:w-28 sm:text-[11px]">
                {formatRoiPercent(s.low)} / {formatRoiPercent(s.high)}
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

  const costValid = result.cost_valid
  const roiKnown = result.roi_pct != null
  const roiPositive = roiKnown && result.roi_pct >= 0
  const netPositive = result.net_value >= 0

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Headline metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Risk-adjusted ROI"
          value={
            <span key={flashKey} className="data-flash">
              {formatRoiPercent(result.roi_pct)}
            </span>
          }
          change={
            costValid
              ? `${formatMultiple(result.risk_adjusted_multiple)} return on cost`
              : 'Add a cost to compute ROI'
          }
          changeType={!roiKnown ? 'neutral' : roiPositive ? 'positive' : 'negative'}
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
              {formatCompactAccounting(result.net_value)}
            </span>
          }
          change={formatPayback(result.payback_years) || `Over ${result.years}-yr horizon`}
          changeType={netPositive ? 'positive' : 'negative'}
        />
        <BreakEvenCard result={result} />
      </div>

      {/* Raw vs risk-adjusted — makes IDC's success-probability multiplier explicit */}
      <GlassPanel>
        {costValid ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              IDC adjustment
            </span>
            <span className="metric-value tabular-nums text-text-primary">
              {formatMultiple(result.raw_multiple)}
            </span>
            <span className="text-text-muted">unadjusted</span>
            <span className="text-text-muted">
              → ×{formatPercent(result.success_probability * 100, 0)} success →
            </span>
            <span className="metric-value tabular-nums text-text-primary">
              {formatMultiple(result.risk_adjusted_multiple)}
            </span>
            <span className="text-text-muted">risk-adjusted</span>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              IDC adjustment
            </span>{' '}
            — enter an initial or annual cost to compute the value-to-cost multiple.
          </p>
        )}
      </GlassPanel>

      <ContributionTable perBenefit={result.per_benefit} flashKey={flashKey} />
      <SensitivityTornado sensitivity={result.sensitivity} base={result.roi_pct ?? 0} />
    </div>
  )
}
