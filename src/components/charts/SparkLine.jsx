import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
} from 'recharts'

export default function SparkLine({
  data,
  color = '#0068FF',
  height = 40,
}) {
  if (!data || data.length === 0) return null

  const chartData = data.map((value, i) => ({ i, value }))
  const gradientId = `spark-${color.replace('#', '')}`

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill={`url(#${gradientId})`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
