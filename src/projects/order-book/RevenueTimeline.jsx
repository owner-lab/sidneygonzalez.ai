import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCompact } from '@/utils/formatters'
import useMediaQuery from '@/hooks/useMediaQuery'
import ChartContainer from '@/components/charts/ChartContainer'
import { getRechartsAxisStyle, getGridStroke } from '@/config/chartTheme'

// Bright hex for FILLS/strokes; AA-compliant ink CLASSES for any text the eye reads.
const ON_TIME = '#4AF6C3' // green  — recognised on or before the promised date
const AT_RISK = '#FB8B1E' // orange — recognised after the promised date (late)
const BACKLOG = '#0068FF' // blue   — order book still to be delivered

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtMonth(ym) {
  if (typeof ym === 'string' && /^\d{4}-\d{2}$/.test(ym)) {
    const [y, m] = ym.split('-')
    return `${MONTHS[parseInt(m, 10) - 1]} ${y.slice(2)}`
  }
  return ym
}

// Map each series to its AA-compliant ink class (for TEXT) — the bright hex above is
// for the swatch/fill only. Recharts' default <Legend> colors label TEXT with the
// series hex (1.38:1 in light mode), so we render our own legend instead.
const INK_BY_KEY = {
  realized: 'text-accent-ink-green',
  at_risk: 'text-accent-ink-orange',
  backlog_value: 'text-accent-ink-blue',
}

function AALegend({ payload }) {
  if (!payload?.length) return null
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2">
      {payload.map((e) => (
        <li
          key={e.dataKey}
          className={`flex items-center gap-1.5 text-[11px] ${INK_BY_KEY[e.dataKey] || 'text-text-secondary'}`}
        >
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ backgroundColor: e.color }}
            aria-hidden="true"
          />
          {e.value}
        </li>
      ))}
    </ul>
  )
}

// AA-safe tooltip — text colored via ink classes (never the bright series hex),
// dollars via formatCompact (never toFixed). Mirrors VarianceTimeSeries.
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const recognized = (d.realized || 0) + (d.at_risk || 0)
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-text-primary">{fmtMonth(d.month)}</p>
      <p className="text-accent-ink-green">On-time: {formatCompact(d.realized)}</p>
      <p className="text-accent-ink-orange">At-risk (late): {formatCompact(d.at_risk)}</p>
      <p className="mt-1 text-text-secondary">
        Recognised: <span className="metric-value tabular-nums">{formatCompact(recognized)}</span>
      </p>
      <p className="text-accent-ink-blue">Book remaining: {formatCompact(d.backlog_value)}</p>
      <p className="mt-1 text-text-muted">
        Crews working: {d.active_slots}/{d.capacity_slots}
      </p>
    </div>
  )
}

export default function RevenueTimeline({ timeline, loading = false }) {
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const chartHeight = isMobile ? 280 : 340

  const axisStyle = getRechartsAxisStyle(isMobile)
  const gridStroke = getGridStroke()

  return (
    <ChartContainer
      title="Forward Revenue Timeline"
      subtitle="Monthly recognised margin — on-time vs at-risk — as the order book burns down"
      loading={loading}
      height={360}
    >
      {timeline && timeline.length > 0 && (
        <div role="img" aria-label="Forward revenue timeline: on-time vs at-risk recognised margin with the order book burning down">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={timeline} margin={{ top: 5, right: isMobile ? 8 : 16, bottom: 20, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="month"
                tick={axisStyle}
                tickFormatter={fmtMonth}
                interval={isMobile ? 2 : 1}
                angle={-45}
                textAnchor="end"
                height={55}
              />
              <YAxis
                yAxisId="margin"
                tick={axisStyle}
                tickFormatter={formatCompact}
                width={52}
              />
              <YAxis
                yAxisId="book"
                orientation="right"
                tick={axisStyle}
                tickFormatter={formatCompact}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<AALegend />} />
              <Area
                yAxisId="margin"
                type="monotone"
                dataKey="realized"
                name="On-time margin"
                stackId="rev"
                stroke={ON_TIME}
                strokeWidth={2}
                fill={ON_TIME}
                fillOpacity={0.22}
              />
              <Area
                yAxisId="margin"
                type="monotone"
                dataKey="at_risk"
                name="At-risk margin (late)"
                stackId="rev"
                stroke={AT_RISK}
                strokeWidth={2}
                fill={AT_RISK}
                fillOpacity={0.22}
              />
              <Line
                yAxisId="book"
                type="monotone"
                dataKey="backlog_value"
                name="Order book remaining"
                stroke={BACKLOG}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <span className="sr-only">
            Stacked area chart of monthly recognised margin split into on-time and at-risk,
            with a dashed line showing the order book value burning down over the horizon.
          </span>
        </div>
      )}
    </ChartContainer>
  )
}
