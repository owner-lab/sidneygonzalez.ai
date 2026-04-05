import MetricCard from '@/components/ui/MetricCard'
import SparkLine from '@/components/charts/SparkLine'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { formatCompact, formatPercent } from '@/utils/formatters'

export default function ExecutiveSummary({ data, loading }) {
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

  // Compute MoM change from sparkline
  const lastTwo = (arr) => {
    if (!arr || arr.length < 2) return { change: '', type: 'neutral' }
    const prev = arr[arr.length - 2]
    const curr = arr[arr.length - 1]
    const pct = ((curr - prev) / prev) * 100
    return {
      change: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% MoM`,
      type: pct >= 0 ? 'positive' : 'negative',
    }
  }

  const revMoM = lastTwo(data.revenue_sparkline)
  const fcfMoM = lastTwo(data.fcf_sparkline)
  const cccMoM = lastTwo(data.ccc_sparkline)
  // CCC: lower is better, invert the type
  cccMoM.type = cccMoM.type === 'positive' ? 'negative' : 'positive'

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Revenue"
        value={formatCompact(data.total_revenue)}
        change={revMoM.change}
        changeType={revMoM.type}
      >
        <SparkLine data={data.revenue_sparkline} color="#0068FF" />
      </MetricCard>

      <MetricCard
        label="EBITDA"
        value={formatCompact(data.ebitda)}
        change={`${formatPercent(data.ebitda_margin)} margin`}
        changeType="neutral"
      >
        <SparkLine data={data.ebitda_sparkline} color="#4AF6C3" />
      </MetricCard>

      <MetricCard
        label="Free Cash Flow"
        value={formatCompact(data.free_cash_flow)}
        change={fcfMoM.change}
        changeType={fcfMoM.type}
      >
        <SparkLine data={data.fcf_sparkline} color="#0068FF" />
      </MetricCard>

      <MetricCard
        label="Cash Conversion Cycle"
        value={`${data.ccc} days`}
        change={cccMoM.change}
        changeType={cccMoM.type}
      >
        <SparkLine data={data.ccc_sparkline} color="#A78BFA" />
      </MetricCard>
    </div>
  )
}
