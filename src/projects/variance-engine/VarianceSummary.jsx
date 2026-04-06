import MetricCard from '@/components/ui/MetricCard'
import SparkLine from '@/components/charts/SparkLine'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { formatVariance, formatCompact } from '@/utils/formatters'

export default function VarianceSummary({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <MetricCard key={i} label="Loading..." value="">
            <SkeletonLoader lines={2} />
          </MetricCard>
        ))}
      </div>
    )
  }

  const varianceType = data.total_variance > 0 ? 'negative' : 'positive'

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Variance"
        value={formatVariance(data.total_variance)}
        change={`${data.total_variance_pct > 0 ? '+' : ''}${data.total_variance_pct}% of budget`}
        changeType={varianceType}
      >
        <SparkLine
          data={data.variance_sparkline}
          color={varianceType === 'negative' ? '#FF433D' : '#4AF6C3'}
        />
      </MetricCard>

      <MetricCard
        label="Anomalies Detected"
        value={data.anomaly_count}
        change="flagged by Isolation Forest"
        changeType={data.anomaly_count > 20 ? 'negative' : 'neutral'}
      />

      <MetricCard
        label="Transactions Analyzed"
        value={formatCompact(data.transactions_analyzed)}
        change={`${data.raw_counts?.vendors || 256}+ vendors`}
        changeType="neutral"
      />

      <MetricCard
        label="Highest Risk"
        value={data.highest_risk_department}
        change={`${data.highest_risk_pct > 0 ? '+' : ''}${data.highest_risk_pct}% variance`}
        changeType="negative"
      />
    </div>
  )
}
