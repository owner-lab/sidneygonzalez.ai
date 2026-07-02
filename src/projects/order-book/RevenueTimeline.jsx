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
  ReferenceLine,
} from 'recharts'
import { formatCompact } from '@/utils/formatters'
import useMediaQuery from '@/hooks/useMediaQuery'
import ChartContainer from '@/components/charts/ChartContainer'
import { getRechartsAxisStyle, getGridStroke } from '@/config/chartTheme'

// Bright hex for FILLS/strokes; AA-compliant ink CLASSES for any text the eye reads.
const ON_TIME    = '#4AF6C3' // green  — recognised on or before the promised date
const AT_RISK    = '#FB8B1E' // orange — recognised after the promised date (late)
const BACKLOG    = '#0068FF' // blue   — order book still to be delivered
const OP_PROFIT  = '#94A3B8' // slate  — net-of-overhead operating profit (base)
const OP_STRESS  = '#FF433D' // red    — operating profit under downturn stress

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
  realized:              'text-accent-ink-green',
  at_risk:               'text-accent-ink-orange',
  backlog_value:         'text-accent-ink-blue',
  operating_profit:      'text-text-secondary',
  stress_op_profit:      'text-impact-negative',
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
// dollars via formatCompact. Shows operating_profit and stress when present.
function CustomTooltip({ active, payload, stressMode }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const recognized = (d.realized || 0) + (d.at_risk || 0)
  const hasOp = d.operating_profit != null
  const hasStress = stressMode && d.stress_op_profit != null
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-text-primary">{fmtMonth(d.month)}</p>
      <p className="text-accent-ink-green">On-time: {formatCompact(d.realized)}</p>
      <p className="text-accent-ink-orange">At-risk (late): {formatCompact(d.at_risk)}</p>
      <p className="mt-1 text-text-secondary">
        Gross margin: <span className="metric-value tabular-nums">{formatCompact(recognized)}</span>
      </p>
      {hasOp && (
        <p className="text-text-secondary">
          Operating profit:{' '}
          <span
            className={`metric-value tabular-nums ${d.operating_profit < 0 ? 'text-impact-negative' : ''}`}
          >
            {formatCompact(d.operating_profit)}
          </span>
          {d.fixed_cost_monthly > 0 && (
            <span className="ml-1 text-text-muted">
              (−{formatCompact(d.fixed_cost_monthly)} overhead)
            </span>
          )}
        </p>
      )}
      {hasStress && (
        <p className="mt-1 text-impact-negative">
          Stress op. profit:{' '}
          <span className="metric-value tabular-nums">{formatCompact(d.stress_op_profit)}</span>
        </p>
      )}
      <p className="mt-1 text-accent-ink-blue">Book remaining: {formatCompact(d.backlog_value)}</p>
      {d.coverage_months != null && (
        <p className="text-text-muted">Coverage: {d.coverage_months} mo</p>
      )}
      <p className="mt-1 text-text-muted">
        Crews working: {d.active_slots}/{d.capacity_slots}
      </p>
    </div>
  )
}

// Merge base and stress timelines into one dataset for ComposedChart.
// Stress data keys are prefixed so they sit alongside base keys on the same x-axis.
function mergeTimelines(timeline, stressTimeline) {
  if (!stressTimeline || !stressTimeline.length) return timeline
  return timeline.map((entry, i) => {
    const s = stressTimeline[i]
    if (!s) return entry
    return {
      ...entry,
      stress_op_profit: s.operating_profit,
    }
  })
}

export default function RevenueTimeline({ timeline, stressTimeline, stressMode = false, loading = false }) {
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const chartHeight = isMobile ? 280 : 340

  const axisStyle = getRechartsAxisStyle(isMobile)
  const gridStroke = getGridStroke()

  const hasFixedCost = timeline?.some((e) => e.fixed_cost_monthly > 0)
  const data = mergeTimelines(timeline || [], stressMode ? stressTimeline : null)

  return (
    <ChartContainer
      title="Forward Revenue Timeline"
      subtitle={
        stressMode
          ? 'Base vs. stress scenario — operating profit diverges from gross margin as fixed overhead holds'
          : hasFixedCost
          ? 'Monthly recognised margin vs. net operating profit after fixed overhead'
          : 'Monthly recognised margin — on-time vs at-risk — as the order book burns down'
      }
      loading={loading}
      height={360}
    >
      {data && data.length > 0 && (
        <div
          role="img"
          aria-label={
            stressMode
              ? 'Forward revenue timeline with stress scenario overlay showing operating profit divergence'
              : 'Forward revenue timeline: on-time vs at-risk recognised margin with the order book burning down'
          }
        >
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={data} margin={{ top: 5, right: isMobile ? 8 : 16, bottom: 20, left: 5 }}>
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

              {/* Zero reference — makes operating profit sign visible at a glance */}
              {hasFixedCost && (
                <ReferenceLine
                  yAxisId="margin"
                  y={0}
                  stroke={gridStroke}
                  strokeDasharray="2 3"
                  strokeWidth={1}
                />
              )}

              <Tooltip content={<CustomTooltip stressMode={stressMode} />} />
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

              {/* Operating profit line — net of fixed overhead. Sits below gross margin
                  when fixed costs exist; diverges visibly when the book thins and overhead
                  is no longer absorbed. */}
              {hasFixedCost && (
                <Line
                  yAxisId="margin"
                  type="monotone"
                  dataKey="operating_profit"
                  name="Operating profit (net overhead)"
                  stroke={OP_PROFIT}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                  connectNulls
                />
              )}

              {/* Stress overlay — only rendered when stress mode is active */}
              {stressMode && (
                <Line
                  yAxisId="margin"
                  type="monotone"
                  dataKey="stress_op_profit"
                  name="Stress: operating profit (−20% book)"
                  stroke={OP_STRESS}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          <span className="sr-only">
            {stressMode
              ? 'Stacked area chart of monthly recognised margin with base and stress operating profit lines overlaid, showing divergence from gross margin.'
              : 'Stacked area chart of monthly recognised margin split into on-time and at-risk, with a dashed line showing the order book value burning down over the horizon.'}
          </span>
        </div>
      )}
    </ChartContainer>
  )
}
