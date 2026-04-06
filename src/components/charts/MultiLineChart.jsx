import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import useMediaQuery from '@/hooks/useMediaQuery'
import { getRechartsAxisStyle, getGridStroke } from '@/config/chartTheme'

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-text-primary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toFixed(1)}{unit}
        </p>
      ))}
    </div>
  )
}

export default function MultiLineChart({
  data,
  lineKeys,
  xKey = 'month',
  thresholds = [],
  formatY,
  height = 350,
  unit = '',
}) {
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const chartHeight = isMobile ? 250 : height

  if (!data || data.length === 0) return null

  const axisStyle = getRechartsAxisStyle(isMobile)
  const gridStroke = getGridStroke()

  const tickFormatter = (val) => {
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}$/)) {
      const [y, m] = val.split('-')
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${months[parseInt(m) - 1]} ${y.slice(2)}`
    }
    return val
  }

  return (
    <div role="img" aria-label="Working capital efficiency trend chart">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} margin={{ top: 5, right: isMobile ? 10 : 20, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey={xKey}
            tick={axisStyle}
            tickFormatter={tickFormatter}
            interval={isMobile ? 5 : (data.length > 12 ? 2 : 0)}
            angle={isMobile ? -55 : (data.length > 12 ? -45 : 0)}
            textAnchor={isMobile || data.length > 12 ? 'end' : 'middle'}
            height={isMobile || data.length > 12 ? 60 : 30}
          />
          <YAxis
            tick={axisStyle}
            tickFormatter={formatY || ((v) => `${v}`)}
            width={45}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend
            wrapperStyle={{ fontSize: isMobile ? 9 : 11, fontFamily: 'Inter' }}
            iconSize={isMobile ? 8 : 14}
          />

          {thresholds.map((t) => (
            <ReferenceLine
              key={t.label}
              y={t.value}
              stroke={t.color || '#94A3B8'}
              strokeDasharray="6 4"
            />
          ))}

          {lineKeys.map(({ key, color, label }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={label}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 2, fill: color }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <span className="sr-only">
        Line chart showing working capital metrics over time with benchmark thresholds
      </span>
    </div>
  )
}
