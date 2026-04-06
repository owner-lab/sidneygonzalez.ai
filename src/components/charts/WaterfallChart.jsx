import { ResponsiveBar } from '@nivo/bar'
import { formatCompact } from '@/utils/formatters'
import useMediaQuery from '@/hooks/useMediaQuery'

/**
 * Waterfall chart using Nivo stacked bars.
 *
 * Each bar has two segments: an invisible "spacer" (positions the bar)
 * and a visible "value" (the actual amount). The spacer height equals
 * the cumulative total up to that point.
 *
 * data format: [
 *   { label: 'Operating', value: 145_000_000, type: 'increase' },
 *   { label: 'Investing', value: -32_000_000, type: 'decrease' },
 *   { label: 'Financing', value: -18_000_000, type: 'decrease' },
 *   { label: 'Net Change', value: 95_000_000, type: 'total' },
 * ]
 */

function buildWaterfallData(items) {
  const data = []
  let runningTotal = 0

  for (const item of items) {
    if (item.type === 'total') {
      // Total bar starts from 0
      data.push({
        label: item.label,
        spacer: item.value >= 0 ? 0 : item.value,
        positive: item.value >= 0 ? item.value : 0,
        negative: item.value < 0 ? Math.abs(item.value) : 0,
        rawValue: item.value,
      })
    } else {
      const value = item.value
      if (value >= 0) {
        data.push({
          label: item.label,
          spacer: runningTotal,
          positive: value,
          negative: 0,
          rawValue: value,
        })
      } else {
        data.push({
          label: item.label,
          spacer: runningTotal + value, // offset down by the negative amount
          positive: 0,
          negative: Math.abs(value),
          rawValue: value,
        })
      }
      runningTotal += value
    }
  }

  return data
}

const NIVO_THEME = {
  text: { fill: '#94A3B8', fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
  grid: { line: { stroke: 'rgba(255,255,255,0.05)' } },
  axis: {
    ticks: { text: { fill: '#94A3B8', fontFamily: '"JetBrains Mono", monospace', fontSize: 11 } },
    legend: { text: { fill: '#94A3B8', fontFamily: 'Inter', fontSize: 12 } },
  },
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

export default function WaterfallChart({
  data,
  height = 350,
  formatValue,
}) {
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const chartHeight = isMobile ? 250 : height

  if (!data || data.length === 0) return null

  const waterfallData = buildWaterfallData(data)
  const fmt = formatValue || formatCompact

  return (
    <div role="img" aria-label="Cash flow waterfall chart" style={{ height: chartHeight }}>
      <ResponsiveBar
        data={waterfallData}
        keys={['spacer', 'positive', 'negative']}
        indexBy="label"
        margin={{ top: 20, right: isMobile ? 10 : 20, bottom: isMobile ? 50 : 40, left: isMobile ? 50 : 70 }}
        padding={0.3}
        layout="vertical"
        colors={({ id }) => {
          if (id === 'spacer') return 'transparent'
          if (id === 'positive') return '#4AF6C3'
          return '#FF433D'
        }}
        borderWidth={0}
        enableGridX={false}
        enableGridY={true}
        gridYValues={isMobile ? 3 : 5}
        axisLeft={{
          tickSize: 0,
          tickPadding: 4,
          format: fmt,
          tickValues: isMobile ? 3 : 5,
        }}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          tickRotation: isMobile ? -35 : 0,
        }}
        enableLabel={false}
        tooltip={({ data: d }) => (
          <div className="glass-panel rounded-lg px-3 py-2 text-xs">
            <span className="font-medium text-text-primary">{d.label}: </span>
            <span className={d.rawValue >= 0 ? 'text-impact-positive' : 'text-impact-negative'}>
              {fmt(d.rawValue)}
            </span>
          </div>
        )}
        theme={NIVO_THEME}
        animate={true}
        motionConfig="gentle"
      />
      <span className="sr-only">
        Waterfall chart showing cash flow from operations, investing, and financing activities
      </span>
    </div>
  )
}
