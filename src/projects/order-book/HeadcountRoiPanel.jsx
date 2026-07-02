import GlassPanel from '@/components/ui/GlassPanel'
import MetricCard from '@/components/ui/MetricCard'
import {
  formatCompact,
  formatCompactAccounting,
  formatRoiPercent,
  formatMultiple,
  formatPaybackMonths,
} from '@/utils/formatters'

// Re-keying by flashKey replays the one-shot data-flash pulse — visible proof the
// figure recomputed live in Python, even when a value is unchanged by the input.
function Flash({ flashKey, className = '', children }) {
  return (
    <span key={flashKey} className={`data-flash inline-block rounded ${className}`}>
      {children}
    </span>
  )
}

function Narrative({ roi, summary }) {
  const added = roi.added_teams
  const cleared = summary.backlog_cleared_pct
  const book = formatCompact(summary.backlog_value)

  let body
  if (added === 0) {
    body = (
      <>
        No crew added. Move <span className="font-medium text-text-primary">Delivery teams</span> above
        the current {roi.baseline_teams ?? 3}-crew baseline to price the investment — the model only
        computes a return on capacity you actually add.
      </>
    )
  } else if (roi.roi_pct != null && roi.roi_pct >= 0) {
    body = (
      <>
        Funding {added === 1 ? 'the next crew' : `${added} more crews`} works the {book} book
        down {cleared}% within the horizon and pulls late revenue forward — a risk-adjusted{' '}
        <span className="font-medium text-impact-positive">{formatRoiPercent(roi.roi_pct)} ROI</span>,{' '}
        {formatCompactAccounting(roi.npv)} NPV, payback in {formatPaybackMonths(roi.payback_months)}.
      </>
    )
  } else {
    body = (
      <>
        At these assumptions {added === 1 ? 'the extra crew' : `${added} extra crews`} don&apos;t pay:{' '}
        <span className="font-medium text-impact-negative">{formatRoiPercent(roi.roi_pct)} ROI</span>,{' '}
        {formatCompactAccounting(roi.npv)} NPV. The capacity helps clear the book, but the loaded crew
        cost outruns the margin it frees — hold off, or revisit at higher growth.
      </>
    )
  }

  return (
    <GlassPanel>
      <p className="text-sm leading-relaxed text-text-secondary">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent-ink-blue">
          The call:{' '}
        </span>
        {body}
      </p>
    </GlassPanel>
  )
}

function ValueSplit({ roi, flashKey }) {
  if (roi.added_teams === 0) return null
  const quality = roi.quality_pv_gain || 0
  const throughput = roi.throughput_pv_gain || 0
  const total = quality + throughput || 1
  const qPct = Math.max(0, Math.min(100, (quality / total) * 100))

  return (
    <GlassPanel>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Where the value comes from
        </h4>
        <Flash
          flashKey={flashKey}
          className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-medium text-accent-ink-green"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-green" aria-hidden="true" />
          Live
        </Flash>
      </div>

      <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-bg-hover">
        <div className="h-full bg-accent-green/70" style={{ width: `${qPct}%` }} aria-hidden="true" />
        <div className="h-full bg-accent-blue/70" style={{ width: `${100 - qPct}%` }} aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="flex items-center gap-1.5 text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-accent-green" aria-hidden="true" />
            On-time conversion
          </p>
          <p className="metric-value mt-0.5 tabular-nums text-text-primary">
            <Flash flashKey={flashKey}>{formatCompact(quality)}</Flash>
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">Late book margin pulled on-time</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-accent-blue" aria-hidden="true" />
            Growth throughput
          </p>
          <p className="metric-value mt-0.5 tabular-nums text-text-primary">
            <Flash flashKey={flashKey}>{formatCompact(throughput)}</Flash>
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">New orders the freed capacity can take</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
        Throughput is the larger, more assumption-driven half: it values freed crew-months at the
        book&apos;s blended margin and a calibrated fill rate (0.55 + 2.5×growth), risk-adjusted by your
        realization rate — a planning assumption, not a booked order.
      </p>
    </GlassPanel>
  )
}

// Coverage color: green > 12 months (strong buffer), orange 6–12 (moderate), red < 6 (exposed).
// Research basis: Kangasluoma (2016) found companies with large backlogs entering 2009 saw revenue
// decline only 13% while operating profit fell 35% — book coverage is the protective mechanism.
function coverageColor(months) {
  if (months == null) return 'text-text-muted'
  if (months >= 12) return 'text-impact-positive'
  if (months >= 6)  return 'text-impact-warning'
  return 'text-impact-negative'
}

function coverageSub(months) {
  if (months == null) return 'not computed'
  if (months >= 12) return 'strong downturn buffer'
  if (months >= 6)  return 'moderate buffer'
  return 'exposed — low buffer'
}

function SummaryStrip({ summary, flashKey }) {
  const coverage = summary.coverage_months_now
  const hasOpProfit = summary.fixed_cost_base_monthly > 0
  const opProfit = summary.operating_profit_total
  const opPositive = opProfit != null && opProfit >= 0

  const baseItems = [
    {
      label: 'Order book',
      value: (
        <Flash flashKey={flashKey}>{formatCompact(summary.backlog_value)}</Flash>
      ),
      sub: `${summary.backlog_projects} projects`,
    },
    {
      label: 'Coverage runway',
      value: (
        <Flash flashKey={flashKey}>
          <span className={coverageColor(coverage)}>
            {coverage != null ? `${coverage} mo` : '—'}
          </span>
        </Flash>
      ),
      sub: coverageSub(coverage),
      title: 'Remaining book ÷ avg monthly revenue — months of forward revenue protected by committed backlog',
    },
    {
      label: 'At-risk share',
      value: (
        <Flash flashKey={flashKey}>{`${summary.at_risk_share_pct}%`}</Flash>
      ),
      sub: 'recognised late',
    },
    {
      label: 'Cleared in horizon',
      value: (
        <Flash flashKey={flashKey}>{`${summary.backlog_cleared_pct}%`}</Flash>
      ),
      sub: `${summary.horizon_months}-month view`,
    },
    {
      label: 'Capacity-short',
      value: (
        <Flash flashKey={flashKey}>{`${summary.months_capacity_short} mo`}</Flash>
      ),
      sub: 'book exceeds crews',
    },
  ]

  // Operating profit only shown when fixed overhead is non-zero — otherwise it
  // duplicates the gross margin figure and adds no information.
  const items = hasOpProfit
    ? [
        ...baseItems,
        {
          label: 'Op. profit (net overhead)',
          value: (
            <Flash flashKey={flashKey}>
              <span className={opPositive ? 'text-impact-positive' : 'text-impact-negative'}>
                {formatCompactAccounting(opProfit)}
              </span>
            </Flash>
          ),
          sub: `over ${summary.horizon_months}-month horizon`,
          title: 'Total gross margin minus fixed overhead over the horizon — diverges from gross margin when projects slip and fixed costs go unabsorbed',
        },
      ]
    : baseItems

  return (
    <div className={`grid grid-cols-2 gap-3 ${hasOpProfit ? 'sm:grid-cols-3' : 'sm:grid-cols-3 lg:grid-cols-5'}`}>
      {items.map((it) => (
        <GlassPanel key={it.label} className="flex flex-col gap-0.5" title={it.title}>
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            {it.label}
          </span>
          <span className="metric-value text-lg font-semibold tabular-nums text-text-primary">
            {it.value}
          </span>
          <span className="text-[11px] text-text-muted">{it.sub}</span>
        </GlassPanel>
      ))}
    </div>
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
        What moves the crew ROI most
      </h4>
      <p className="mb-4 text-xs text-text-muted">
        ROI swing as each driver alone moves across a plausible range — cost ±20%, growth ±4 pts,
        crews ±1, realization ±10 pts, a 3-month flagship slip — holding all else fixed. The longest
        bar is the assumption the case depends on most. Dashed line = current ROI ({formatRoiPercent(base)}).
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

export default function HeadcountRoiPanel({ result, flashKey }) {
  if (!result) return null
  const roi = result.headcount_roi
  const summary = result.summary
  // Defend the never-blank contract against a partial/malformed result: keep last-good
  // rather than throwing on a missing nested object (mirrors the array guards in the charts).
  if (!roi || !summary) return null

  const roiKnown = roi.roi_pct != null
  const roiPositive = roiKnown && roi.roi_pct >= 0
  const npvPositive = (roi.npv ?? 0) >= 0

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Narrative roi={roi} summary={summary} />

      {/* Headline crew-investment metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Risk-adjusted ROI"
          value={
            <span key={flashKey} className="data-flash">
              {formatRoiPercent(roi.roi_pct)}
            </span>
          }
          change={
            roi.cost_valid
              ? `${formatMultiple(roi.raw_multiple)} on PV cost`
              : 'Add a crew to compute ROI'
          }
          changeType={!roiKnown ? 'neutral' : roiPositive ? 'positive' : 'negative'}
        />
        <MetricCard
          label="Net value (NPV)"
          value={
            <span className={npvPositive ? 'text-impact-positive' : 'text-impact-negative'}>
              {formatCompactAccounting(roi.npv)}
            </span>
          }
          change={`vs ${formatCompact(roi.total_cost)} crew cost`}
          changeType={npvPositive ? 'positive' : 'negative'}
        />
        <MetricCard
          label="Payback"
          value={
            <span key={flashKey} className="data-flash">
              {formatPaybackMonths(roi.payback_months)}
            </span>
          }
          change={roi.added_teams > 0 ? `${roi.added_teams} crew${roi.added_teams === 1 ? '' : 's'} added` : 'No crew added'}
          changeType={roi.payback_months != null ? 'positive' : 'neutral'}
        />
        <MetricCard
          label="Incremental margin"
          value={formatCompact(roi.incremental_pv_margin)}
          change="present-valued over horizon"
          changeType="neutral"
        />
      </div>

      <ValueSplit roi={roi} flashKey={flashKey} />
      <SummaryStrip summary={summary} flashKey={flashKey} />
      <SensitivityTornado sensitivity={result.sensitivity} base={roi.roi_pct ?? 0} />
    </div>
  )
}
