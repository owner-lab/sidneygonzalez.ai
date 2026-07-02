import GlassPanel from '@/components/ui/GlassPanel'
import { formatCompact, formatCompactAccounting } from '@/utils/formatters'

// Accounting-convention delta: negative in red parentheses, positive in green.
function Delta({ pct, className = '' }) {
  if (pct == null) return <span className="text-text-muted">—</span>
  const neg = pct < 0
  return (
    <span className={`metric-value tabular-nums ${neg ? 'text-impact-negative' : 'text-impact-positive'} ${className}`}>
      {neg ? `(${Math.abs(pct).toFixed(1)}%)` : `+${pct.toFixed(1)}%`}
    </span>
  )
}

// Comparison row: two columns of deltas — your book vs the Kangasluoma benchmark.
// Colors tell the CFO whether their book is more or less resilient than the 18-company average.
function CompRow({ label, yourDelta, benchmarkDelta, sub }) {
  const yourWorse =
    yourDelta != null && benchmarkDelta != null
      ? yourDelta < benchmarkDelta
      : false

  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-0.5 border-b border-border-subtle/40 py-2.5 last:border-0">
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        {sub && <p className="text-[10px] text-text-muted">{sub}</p>}
      </div>
      <div className="text-right">
        <p className={`text-[10px] font-medium uppercase tracking-wider ${yourWorse ? 'text-impact-negative' : 'text-text-muted'}`}>
          Your book
        </p>
        <Delta pct={yourDelta} />
      </div>
      <div className="text-right">
        <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Benchmark
        </p>
        <Delta pct={benchmarkDelta} />
      </div>
    </div>
  )
}

export default function StressPanel({ stressComparison }) {
  if (!stressComparison) return null

  const sc = stressComparison
  const amplification = sc.amplification
  const amplificationVsBenchmark =
    amplification != null ? amplification - sc.benchmark_amplification : null

  // Has fixed overhead been set? Without it, operating profit == gross margin
  // and the stress test shows only the revenue dimension of risk.
  const hasFixedCost = sc.base_op_profit !== sc.base_recognized

  return (
    <GlassPanel>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Downturn Stress Analysis
          </h4>
          <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
            Your book stressed at {Math.abs(sc.stress_backlog_applied_pct)}% contract-value reduction
            — the measured 2008→09 rate across 18 ETO manufacturers (Kangasluoma, 2016). Results
            reveal how your cost structure amplifies a demand shock into operating profit.
          </p>
        </div>
        <span className="mt-0.5 shrink-0 rounded-md bg-impact-negative/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-impact-negative ring-1 ring-impact-negative/30">
          Stress
        </span>
      </div>

      {/* Amplification metric — the most CFO-credible single number */}
      {amplification != null && (
        <div className="mb-4 rounded-lg bg-bg-hover/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Fixed-cost amplification
          </p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className={`text-2xl font-semibold tabular-nums leading-none ${amplification > sc.benchmark_amplification ? 'text-impact-negative' : 'text-impact-positive'}`}>
              {amplification.toFixed(2)}×
            </span>
            <p className="text-xs leading-relaxed text-text-secondary">
              Operating profit declines {amplification.toFixed(2)}× faster than revenue when the
              book contracts.{' '}
              {amplificationVsBenchmark != null && Math.abs(amplificationVsBenchmark) > 0.05 && (
                amplificationVsBenchmark > 0
                  ? <span className="text-impact-negative">
                      {amplificationVsBenchmark.toFixed(2)}× more exposed than the 2009 benchmark
                      ({sc.benchmark_amplification}×).
                    </span>
                  : <span className="text-impact-positive">
                      {Math.abs(amplificationVsBenchmark).toFixed(2)}× more resilient than the
                      2009 benchmark ({sc.benchmark_amplification}×).
                    </span>
              )}
            </p>
          </div>
          {!hasFixedCost && (
            <p className="mt-2 text-[11px] text-text-muted">
              Set a fixed overhead (monthly) above zero to see cost-structure amplification — without
              fixed costs, operating profit tracks gross margin 1:1.
            </p>
          )}
        </div>
      )}

      {/* Comparison table: your book vs Kangasluoma 2009 benchmarks */}
      <div className="mb-1">
        <CompRow
          label="Revenue impact"
          sub="Recognised gross margin under stress"
          yourDelta={sc.revenue_delta_pct}
          benchmarkDelta={sc.benchmark_revenue_delta_pct}
        />
        {hasFixedCost && (
          <CompRow
            label="Operating profit impact"
            sub="After fixed overhead — the cost-rigidity gap"
            yourDelta={sc.op_profit_delta_pct}
            benchmarkDelta={sc.benchmark_op_profit_delta_pct}
          />
        )}
      </div>

      {/* Absolute figures — base vs stress */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-bg-hover/30 px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Base — horizon total
          </p>
          <p className="metric-value mt-1 tabular-nums text-sm text-text-primary">
            {formatCompact(sc.base_recognized)}
          </p>
          <p className="text-[11px] text-text-muted">gross margin</p>
          {hasFixedCost && (
            <p className="metric-value mt-1 tabular-nums text-sm">
              {formatCompactAccounting(sc.base_op_profit)}
            </p>
          )}
          {hasFixedCost && (
            <p className="text-[11px] text-text-muted">operating profit</p>
          )}
        </div>
        <div className="rounded-lg bg-impact-negative/5 px-3 py-2.5 ring-1 ring-impact-negative/15">
          <p className="text-[10px] font-medium uppercase tracking-wider text-impact-negative">
            Stress — horizon total
          </p>
          <p className="metric-value mt-1 tabular-nums text-sm text-impact-negative">
            {formatCompact(sc.stress_recognized)}
          </p>
          <p className="text-[11px] text-text-muted">gross margin</p>
          {hasFixedCost && (
            <p className={`metric-value mt-1 tabular-nums text-sm ${sc.stress_op_profit < 0 ? 'text-impact-negative' : ''}`}>
              {formatCompactAccounting(sc.stress_op_profit)}
            </p>
          )}
          {hasFixedCost && (
            <p className="text-[11px] text-text-muted">operating profit</p>
          )}
        </div>
      </div>

      {/* Mechanism note */}
      <p className="mt-4 text-[11px] leading-relaxed text-text-muted">
        The gap between revenue and operating profit decline is fixed-cost rigidity — rent, management
        salaries, and G&amp;A hold while delivered margin falls. Kangasluoma (2016) found this gap
        produced the 2.66× amplification across 18 publicly listed ETO manufacturers in 2009. A larger
        book entering a downturn compresses the gap: committed backlog absorbs overhead until it burns
        down, which is why book coverage months is a direct proxy for downturn resilience.
      </p>
    </GlassPanel>
  )
}
