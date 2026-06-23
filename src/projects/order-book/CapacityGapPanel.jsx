import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import useMediaQuery from '@/hooks/useMediaQuery'
import ChartContainer from '@/components/charts/ChartContainer'
import { getRechartsAxisStyle, getGridStroke } from '@/config/chartTheme'

const SHORT = '#FB8B1E' // orange — months the book demands more crews than you have
const OK = '#0068FF' // blue — months within capacity
const LINE = '#0068FF'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtMonth(ym) {
  if (typeof ym === 'string' && /^\d{4}-\d{2}$/.test(ym)) {
    const [y, m] = ym.split('-')
    return `${MONTHS[parseInt(m, 10) - 1]} ${y.slice(2)}`
  }
  return ym
}

// AA-safe tooltip — ink classes only, no bright series hex on text.
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-text-primary">{fmtMonth(d.month)}</p>
      <p className="text-text-secondary">
        Demand: <span className="metric-value tabular-nums">{d.demand_slots}</span> crews to stay on time
      </p>
      <p className="text-accent-ink-blue">Available: {d.available_slots} crews</p>
      {d.gap > 0 ? (
        <p className="mt-1 text-accent-ink-orange">Short {d.gap} crew{d.gap === 1 ? '' : 's'}</p>
      ) : (
        <p className="mt-1 text-accent-ink-green">Within capacity</p>
      )}
    </div>
  )
}

export default function CapacityGapPanel({ capacityGap, teams, loading = false }) {
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const chartHeight = isMobile ? 220 : 260
  const axisStyle = getRechartsAxisStyle(isMobile)
  const gridStroke = getGridStroke()

  if (!capacityGap || capacityGap.length === 0) return null

  const shortMonths = capacityGap.filter((g) => g.gap > 0).length

  return (
    <ChartContainer
      title="Where the Book Outruns Your Crews"
      subtitle={
        shortMonths > 0
          ? `Crews the order book demands each month to hit every promised date. ${shortMonths} month${shortMonths === 1 ? '' : 's'} exceed your ${teams}-crew capacity (orange).`
          : `Crews the order book demands each month. Your ${teams} crews cover every month.`
      }
      loading={loading}
      height={280}
    >
      <div role="img" aria-label="Capacity demand versus available crews by month">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={capacityGap} margin={{ top: 5, right: isMobile ? 8 : 16, bottom: 20, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="month"
              tick={axisStyle}
              tickFormatter={fmtMonth}
              interval={isMobile ? 2 : 1}
              angle={-45}
              textAnchor="end"
              height={55}
            />
            <YAxis tick={axisStyle} width={28} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(var(--color-text-muted) / 0.08)' }} />
            <ReferenceLine
              y={teams}
              stroke={LINE}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `${teams} crews`,
                position: 'right',
                fontSize: 10,
                fill: getRechartsAxisStyle(isMobile).fill,
                fontFamily: '"JetBrains Mono", monospace',
              }}
            />
            <Bar dataKey="demand_slots" name="Crews demanded" radius={[2, 2, 0, 0]} maxBarSize={34}>
              {capacityGap.map((g) => (
                <Cell key={g.month} fill={g.gap > 0 ? SHORT : OK} fillOpacity={g.gap > 0 ? 0.85 : 0.4} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <span className="sr-only">
          Bar chart of crews demanded by the order book each month versus the available crew capacity line.
        </span>
      </div>
    </ChartContainer>
  )
}
