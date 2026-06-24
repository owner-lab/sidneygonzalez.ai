import SparkLine from '@/components/charts/SparkLine'
import GlassPanel from '@/components/ui/GlassPanel'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { formatVariance, formatCount } from '@/utils/formatters'

const IMPACT = {
  positive: 'text-impact-positive',
  negative: 'text-impact-negative',
  neutral: 'text-impact-neutral',
}

// Secondary stat — flat and denser than the lead figure, so the summary reads as
// "one headline number + supporting detail" rather than four co-equal cards
// (which would echo the Command Center KPI strip silhouette).
function Stat({ label, value, change, changeType = 'neutral' }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <p className="metric-value mt-1 text-lg font-semibold leading-tight text-text-primary">
        {value}
      </p>
      <p className={`metric-value mt-0.5 text-xs ${IMPACT[changeType]}`}>{change}</p>
    </div>
  )
}

export default function VarianceSummary({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="mb-6 flex flex-col gap-4">
        <GlassPanel>
          <SkeletonLoader lines={3} />
        </GlassPanel>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-3"
            >
              <SkeletonLoader lines={2} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const varianceType = data.total_variance > 0 ? 'negative' : 'positive'

  return (
    <div className="mb-6 flex flex-col gap-4">
      {/* Dominant figure — the one number this engine is about. */}
      <GlassPanel className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Total Variance
          </span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="metric-value text-4xl font-semibold leading-none text-text-primary">
              {formatVariance(data.total_variance)}
            </span>
            <span className={`metric-value text-sm ${IMPACT[varianceType]}`}>
              {`${data.total_variance_pct > 0 ? '+' : ''}${data.total_variance_pct}% of budget`}
            </span>
          </div>
        </div>
        <div className="w-full sm:w-64">
          <SparkLine
            data={data.variance_sparkline}
            color={varianceType === 'negative' ? '#FF433D' : '#4AF6C3'}
          />
        </div>
      </GlassPanel>

      {/* Supporting trio — secondary weight, flat surfaces. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Anomalies Detected"
          value={data.anomaly_count}
          change="flagged by Isolation Forest"
          changeType={data.anomaly_count > 20 ? 'negative' : 'neutral'}
        />
        <Stat
          label="Transactions Analyzed"
          value={formatCount(data.transactions_analyzed)}
          change={`${data.raw_counts?.vendors || 256}+ vendors`}
          changeType="neutral"
        />
        <Stat
          label="Highest Risk"
          value={data.highest_risk_department}
          change={`${data.highest_risk_pct > 0 ? '+' : ''}${data.highest_risk_pct}% variance`}
          changeType="negative"
        />
      </div>
    </div>
  )
}
