import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null

  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-text-primary">{label}</p>
      <p className="text-accent-blue">Budget: {formatCompact(d.budget)}</p>
      <p className="text-accent-green">Actual: {formatCompact(d.actual)}</p>
      {d.anomaly_count > 0 && (
        <p className="mt-1 text-accent-red">
          {d.anomaly_count} anomal{d.anomaly_count === 1 ? 'y' : 'ies'} flagged
        </p>
      )}
    </div>
  )
}

export default function VarianceTimeSeries({ data, loading }) {
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const chartHeight = isMobile ? 250 : 300

  const axisStyle = getRechartsAxisStyle(isMobile)
  const gridStroke = getGridStroke()

  // Add anomaly marker value (null if no anomaly, actual value if anomaly)
  const chartData = data?.map((d) => ({
    ...d,
    anomalyMarker: d.anomaly_count > 0 ? d.actual : null,
  }))

  return (
    <ChartContainer
      title="Monthly Budget vs Actual"
      subtitle="Red dots indicate months with detected anomalies"
      loading={loading}
      height={350}
    >
      {chartData && chartData.length > 0 && (
        <div role="img" aria-label="Monthly budget vs actual trend with anomaly markers">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 15, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="month"
                tick={axisStyle}
                interval={isMobile ? 3 : 0}
                angle={isMobile ? -55 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 55 : 30}
              />
              <YAxis
                tick={axisStyle}
                tickFormatter={formatCompact}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: isMobile ? 9 : 11, fontFamily: 'Inter' }}
                iconSize={isMobile ? 8 : 14}
              />
              <Line
                type="monotone"
                dataKey="budget"
                name="Budget"
                stroke="#0068FF"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="#4AF6C3"
                strokeWidth={2}
                dot={{ r: 2, fill: '#4AF6C3' }}
              />
              <Scatter
                dataKey="anomalyMarker"
                name="Anomaly"
                fill="#FF433D"
                shape="circle"
                legendType="circle"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <span className="sr-only">
            Line chart showing monthly budget vs actual spending with anomaly markers
          </span>
        </div>
      )}
    </ChartContainer>
  )
}
