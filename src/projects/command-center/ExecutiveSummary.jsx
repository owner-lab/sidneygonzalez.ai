import MetricCard from '@/components/ui/MetricCard'
import SparkLine from '@/components/charts/SparkLine'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { formatCompact, formatPercent } from '@/utils/formatters'

export default function ExecutiveSummary({ data, loading, division = 'All' }) {
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

  // Compute MoM change from sparkline. Guard a zero base (no Infinity% MoM) and divide by
  // |prev| so the sign tracks direction even when the prior month is negative (e.g. FCF).
  const lastTwo = (arr) => {
    if (!arr || arr.length < 2) return { change: '', type: 'neutral' }
    const prev = arr[arr.length - 2]
    const curr = arr[arr.length - 1]
    if (prev === 0) return { change: '', type: 'neutral' }
    const pct = ((curr - prev) / Math.abs(prev)) * 100
    return {
      change: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% MoM`,
      type: pct >= 0 ? 'positive' : 'negative',
    }
  }

  // When a single division is selected, FCF and CCC are still the COMPANY figures (the
  // engine only splits revenue/EBITDA by division) — label them so a divisional revenue
  // isn't read alongside a company cash-flow number under one heading.
  const isDivision = division !== 'All'
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
        change={isDivision ? 'company-wide' : fcfMoM.change}
        changeType={isDivision ? 'neutral' : fcfMoM.type}
      >
        <SparkLine data={data.fcf_sparkline} color="#0068FF" />
      </MetricCard>

      <MetricCard
        label="Cash Conversion Cycle"
        value={`${data.ccc} days`}
        change={isDivision ? 'company-wide' : cccMoM.change}
        changeType={isDivision ? 'neutral' : cccMoM.type}
      >
        <SparkLine data={data.ccc_sparkline} color="#D4A843" />
      </MetricCard>
    </div>
  )
}
