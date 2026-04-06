import ChartContainer from '@/components/charts/ChartContainer'
import HeatmapChart from '@/components/charts/HeatmapChart'

function HeatmapTooltip({ cell }) {
  const isOver = cell.value > 0
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-text-primary">
        {cell.serieId} — {cell.data.x}
      </p>
      <p className={isOver ? 'text-impact-negative' : 'text-impact-positive'}>
        {isOver ? '+' : ''}{cell.value}% variance
      </p>
      {cell.data.hasAnomaly && (
        <p className="mt-1 text-accent-red">Anomaly flagged</p>
      )}
    </div>
  )
}

export default function VarianceHeatmap({ data, loading, onCellClick }) {
  return (
    <ChartContainer
      title="Budget Variance Heatmap"
      subtitle="Department × Month — green = under budget, red = over budget"
      loading={loading}
      height={420}
    >
      <HeatmapChart
        data={data}
        height={380}
        tooltip={HeatmapTooltip}
        onClick={onCellClick}
        minValue={-30}
        maxValue={30}
      />
    </ChartContainer>
  )
}
