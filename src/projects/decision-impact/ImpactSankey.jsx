import { useMemo } from 'react'
import ChartContainer from '@/components/charts/ChartContainer'
import SankeyDiagram from '@/components/charts/SankeyDiagram'
import useMediaQuery from '@/hooks/useMediaQuery'

// Division → color for Sankey nodes
const DIVISION_COLORS = {
  Sales: '#0068FF',
  Marketing: '#FB8B1E',
  'Engineering & Product': '#A78BFA',
  Operations: '#4AF6C3',
  Finance: '#06B6D4',
}

// Short labels for mobile
const SHORT_LABELS = {
  pipeline_value: 'Pipeline',
  win_rate: 'Win Rate',
  avg_deal_size: 'Deal Size',
  sales_cycle_days: 'Sales Cycle',
  marketing_spend: 'Mkt Spend',
  mqls_per_month: 'MQLs',
  cac: 'CAC',
  brand_awareness: 'Brand',
  eng_headcount: 'Eng HC',
  feature_velocity: 'Features',
  platform_uptime: 'Uptime',
  product_nps: 'NPS',
  ops_budget: 'Ops Budget',
  fulfillment_rate: 'Fulfillment',
  csat: 'CSAT',
  churn_rate: 'Churn',
  dso: 'DSO',
  operating_margin: 'Op Margin',
  free_cash_flow: 'FCF',
}

const LEGEND_ITEMS = Object.entries(DIVISION_COLORS)

export default function ImpactSankey({
  orgModel,
  kpiLabels,
  kpiDivisions,
  affectedLinks,
  loading,
}) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Build Sankey data with readable labels
  const sankeyData = useMemo(() => {
    if (!orgModel?.sankey) return null

    const labels = isMobile ? SHORT_LABELS : kpiLabels
    const nodes = orgModel.sankey.nodes.map((n) => ({
      ...n,
      label: labels[n.id] || kpiLabels[n.id] || n.id,
    }))

    // Sankey link values must be positive
    const links = orgModel.sankey.links.map((l) => ({
      source: l.source,
      target: l.target,
      value: Math.abs(l.value),
    }))

    return { nodes, links }
  }, [orgModel, kpiLabels, isMobile])

  // Build node color map from division membership
  const nodeColorMap = useMemo(() => {
    const map = {}
    for (const [kpiId, divLabel] of Object.entries(kpiDivisions)) {
      map[kpiId] = DIVISION_COLORS[divLabel] || '#64748B'
    }
    return map
  }, [kpiDivisions])

  return (
    <ChartContainer
      title="KPI Interdependency Network"
      subtitle="How decisions cascade through the organization"
      loading={loading}
      height={500}
    >
      <SankeyDiagram
        data={sankeyData}
        highlightedLinks={affectedLinks}
        nodeColorMap={nodeColorMap}
        height={450}
      />
      {/* Division color legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
        {LEGEND_ITEMS.map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </ChartContainer>
  )
}
