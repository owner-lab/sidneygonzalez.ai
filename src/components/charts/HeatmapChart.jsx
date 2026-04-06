import { ResponsiveHeatMap } from '@nivo/heatmap'
import useMediaQuery from '@/hooks/useMediaQuery'
import useIsDark from '@/hooks/useIsDark'
import { getNivoTheme, getHeatmapNeutral, getAxisColor } from '@/config/chartTheme'

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
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const isDark = useIsDark()
  const chartHeight = isMobile ? 300 : height

  if (!data || data.length === 0) return null

  const nivoTheme = getNivoTheme()
  const neutral = getHeatmapNeutral()
  const axisColor = getAxisColor()

  return (
    <div
      role="img"
      aria-label="Budget variance heatmap by department and month"
      style={{ height: chartHeight }}
      className={isMobile ? 'overflow-x-auto' : ''}
    >
      <div style={{ height: chartHeight, minWidth: isMobile ? 700 : 'auto' }}>
        <ResponsiveHeatMap
          key={isDark ? 'd' : 'l'}
          data={data}
          margin={{ top: 30, right: 20, bottom: 10, left: 120 }}
          forceSquare={false}
          colors={{
            type: 'diverging',
            colors: ['#4AF6C3', neutral, '#FF433D'],
            divergeAt: 0.5,
            minValue: minValue ?? -30,
            maxValue: maxValue ?? 30,
          }}
          emptyColor={neutral}
          borderWidth={1}
          borderColor="var(--color-border-subtle)"
          enableLabels={true}
          labelTextColor={({ value }) => {
            if (value === null || value === undefined) return axisColor
            return Math.abs(value) > 15 ? (isDark ? '#E2E8F0' : '#0F172A') : axisColor
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
          theme={nivoTheme}
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
