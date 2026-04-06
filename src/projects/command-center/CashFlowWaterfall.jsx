import ChartContainer from '@/components/charts/ChartContainer'
import WaterfallChart from '@/components/charts/WaterfallChart'
import { formatCompact } from '@/utils/formatters'

export default function CashFlowWaterfall({ data, loading }) {
  if (!data) return null

  const waterfallData = [
    { label: 'Operating', value: data.operating, type: 'increase' },
    {
      label: 'Investing',
      value: data.investing,
      type: data.investing < 0 ? 'decrease' : 'increase',
    },
    {
      label: 'Financing',
      value: data.financing,
      type: data.financing < 0 ? 'decrease' : 'increase',
    },
    { label: 'Net Change', value: data.net, type: 'total' },
  ]

  return (
    <ChartContainer
      title="Cash Flow Waterfall"
      subtitle="Operating → Investing → Financing → Net"
      loading={loading}
      height={350}
    >
      <WaterfallChart data={waterfallData} height={300} />
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-impact-positive">
          Operating: {formatCompact(data.operating)}
        </span>
        <span className="text-text-muted">+</span>
        <span className="text-impact-negative">
          Investing: {formatCompact(data.investing)}
        </span>
        <span className="text-text-muted">+</span>
        <span className={data.financing >= 0 ? 'text-impact-positive' : 'text-impact-negative'}>
          Financing: {formatCompact(data.financing)}
        </span>
        <span className="text-text-muted">=</span>
        <span className={`font-semibold ${data.net >= 0 ? 'text-impact-positive' : 'text-impact-negative'}`}>
          Net: {formatCompact(data.net)}
        </span>
      </div>
    </ChartContainer>
  )
}
