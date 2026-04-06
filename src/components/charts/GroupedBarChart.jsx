import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCompact } from '@/utils/formatters'
import useMediaQuery from '@/hooks/useMediaQuery'
import { getRechartsAxisStyle, getGridStroke } from '@/config/chartTheme'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-text-primary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {formatCompact(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function GroupedBarChart({
  data,
  dataKeys,
  xKey = 'month',
  stacked = false,
  formatY,
  height = 350,
  onBarClick,
  rotateLabels: rotateLabelsOverride,
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

  // Smart interval: show all labels for short lists, thin for long time series
  const interval = isMobile
    ? (data.length > 8 ? Math.ceil(data.length / 6) - 1 : 0)
    : (data.length > 18 ? 2 : data.length > 8 ? 1 : 0)
  const rotateLabels = rotateLabelsOverride !== undefined
    ? rotateLabelsOverride
    : (isMobile || data.length > 8)

  return (
    <div role="img" aria-label="Revenue by division bar chart">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: rotateLabels ? 20 : 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey={xKey}
            tick={axisStyle}
            tickFormatter={tickFormatter}
            interval={interval}
            angle={rotateLabels ? -45 : 0}
            textAnchor={rotateLabels ? 'end' : 'middle'}
            height={rotateLabels ? 55 : 30}
          />
          <YAxis
            tick={axisStyle}
            tickFormatter={formatY || formatCompact}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: isMobile ? 9 : 11, fontFamily: 'Inter' }}
            iconSize={isMobile ? 8 : 14}
          />
          {dataKeys.map(({ key, color, label }) => (
            <Bar
              key={key}
              dataKey={key}
              name={label}
              fill={color}
              stackId={stacked ? 'stack' : undefined}
              radius={[2, 2, 0, 0]}
              cursor="pointer"
              onClick={onBarClick ? (entry) => onBarClick(key, entry) : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <span className="sr-only">
        Bar chart showing revenue breakdown by business division over time
      </span>
    </div>
  )
}
