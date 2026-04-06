import { ResponsiveHeatMap } from '@nivo/heatmap'
import useMediaQuery from '@/hooks/useMediaQuery'

const NIVO_THEME = {
  text: { fill: '#94A3B8', fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
  tooltip: {
    container: {
      background: 'rgba(17, 17, 24, 0.9)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '12px',
      color: '#E2E8F0',
      backdropFilter: 'blur(12px)',
    },
  },
}

function DefaultTooltip({ cell }) {
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-text-primary">
        {cell.serieId} — {cell.data.x}
      </p>
      <p className={cell.value > 0 ? 'text-impact-negative' : 'text-impact-positive'}>
        {cell.value > 0 ? '+' : ''}{cell.value}% variance
      </p>
    </div>
  )
}

export default function HeatmapChart({
  data,
  height = 400,
  onClick,
  tooltip,
  minValue,
  maxValue,
}) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const chartHeight = isMobile ? 300 : height

  if (!data || data.length === 0) return null

  return (
    <div
      role="img"
      aria-label="Budget variance heatmap by department and month"
      style={{ height: chartHeight }}
      className={isMobile ? 'overflow-x-auto' : ''}
    >
      <div style={{ height: chartHeight, minWidth: isMobile ? 700 : 'auto' }}>
        <ResponsiveHeatMap
          data={data}
          margin={{ top: 30, right: 20, bottom: 10, left: 120 }}
          forceSquare={false}
          colors={{
            type: 'diverging',
            colors: ['#4AF6C3', '#1E1E2E', '#FF433D'],
            divergeAt: 0.5,
            minValue: minValue ?? -30,
            maxValue: maxValue ?? 30,
          }}
          emptyColor="#1E1E2E"
          borderWidth={1}
          borderColor="rgba(255,255,255,0.06)"
          enableLabels={true}
          labelTextColor={({ value }) => {
            if (value === null || value === undefined) return '#64748B'
            return Math.abs(value) > 15 ? '#E2E8F0' : '#94A3B8'
          }}
          label={({ value }) => {
            if (value === null || value === undefined) return ''
            return `${value > 0 ? '+' : ''}${value}%`
          }}
          axisTop={{
            tickSize: 0,
            tickPadding: 8,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 8,
          }}
          hoverTarget="cell"
          cellHoverOthersOpacity={0.4}
          tooltip={tooltip || DefaultTooltip}
          onClick={onClick}
          theme={NIVO_THEME}
          animate={true}
          motionConfig="gentle"
        />
      </div>
      <span className="sr-only">
        Heatmap showing budget variance by department and month.
        Green cells indicate under-budget, red cells indicate over-budget.
      </span>
    </div>
  )
}
