import { useMemo } from 'react'
import { ResponsiveSankey } from '@nivo/sankey'
import useMediaQuery from '@/hooks/useMediaQuery'

const NIVO_THEME = {
  text: { fill: '#94A3B8', fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
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

const DEFAULT_NODE_COLOR = '#64748B'

function LinkTooltip({ link }) {
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-text-primary">
        {link.source.label || link.source.id} → {link.target.label || link.target.id}
      </p>
      <p className="text-text-secondary">
        Coefficient: {link.value}
      </p>
    </div>
  )
}

export default function SankeyDiagram({
  data,
  highlightedLinks = null,
  nodeColorMap = {},
  height = 450,
}) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const chartHeight = isMobile ? 350 : height

  // Build highlighted link key set
  const highlightSet = useMemo(() => {
    const set = new Map()
    if (highlightedLinks) {
      for (const hl of highlightedLinks) {
        set.set(`${hl.source}.${hl.target}`, hl.impact)
      }
    }
    return set
  }, [highlightedLinks])

  const hasHighlights = highlightSet.size > 0

  // Inject startColor/endColor into link data for Nivo
  const coloredData = useMemo(() => {
    if (!data || !data.nodes || !data.links) return null

    const links = data.links.map((link) => {
      const key = `${link.source}.${link.target}`
      if (hasHighlights && highlightSet.has(key)) {
        const impact = highlightSet.get(key)
        const color =
          impact === 'positive' ? '#4AF6C3' :
          impact === 'negative' ? '#FF433D' :
          '#0068FF'
        return { ...link, startColor: color, endColor: color }
      }
      if (hasHighlights) {
        // Dim unaffected links
        return { ...link, startColor: 'rgba(148,163,184,0.08)', endColor: 'rgba(148,163,184,0.08)' }
      }
      return link
    })

    return { nodes: data.nodes, links }
  }, [data, hasHighlights, highlightSet])

  if (!coloredData || coloredData.links.length === 0) return null

  return (
    <div
      role="img"
      aria-label="Organizational KPI interdependency network"
      style={{ height: chartHeight }}
      className={isMobile ? 'overflow-x-auto' : ''}
    >
      <div style={{ height: chartHeight, minWidth: isMobile ? 600 : 'auto' }}>
        <ResponsiveSankey
          data={coloredData}
          margin={{ top: 20, right: isMobile ? 100 : 140, bottom: 20, left: isMobile ? 10 : 20 }}
          align="justify"
          sort="auto"
          nodeOpacity={1}
          nodeHoverOthersOpacity={0.35}
          nodeThickness={14}
          nodeSpacing={18}
          nodeBorderWidth={0}
          nodeBorderRadius={3}
          linkOpacity={hasHighlights ? 0.7 : 0.25}
          linkHoverOthersOpacity={0.1}
          linkContract={2}
          linkBlendMode="normal"
          enableLinkGradient={true}
          colors={(node) => {
            if (nodeColorMap[node.id]) return nodeColorMap[node.id]
            return DEFAULT_NODE_COLOR
          }}
          linkTooltip={LinkTooltip}
          label={(node) => node.label || node.id}
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={isMobile ? 6 : 12}
          labelTextColor="#94A3B8"
          theme={isMobile ? { ...NIVO_THEME, text: { ...NIVO_THEME.text, fontSize: 9 } } : NIVO_THEME}
          animate={true}
          motionConfig="gentle"
        />
      </div>
      <span className="sr-only">
        Sankey diagram showing how 19 KPIs across 5 divisions are connected through
        cause-and-effect relationships. Each link represents a coefficient-weighted
        dependency with a time lag.
      </span>
    </div>
  )
}
