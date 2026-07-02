/**
 * Reactive chart theme that reads CSS custom properties.
 * Call at render time (not module scope) so it picks up theme changes.
 */

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function rgbChannelsToHex(channels) {
  // Convert "226 232 240" to "#E2E8F0"
  const parts = channels.split(' ').map(Number)
  if (parts.length !== 3) return channels
  return '#' + parts.map((n) => n.toString(16).padStart(2, '0')).join('')
}

export function getAxisColor() {
  return rgbChannelsToHex(getCSSVar('--chart-axis'))
}

export function getTooltipTextColor() {
  return rgbChannelsToHex(getCSSVar('--chart-tooltip-text'))
}

export function getNivoTheme() {
  const axisColor = getAxisColor()
  const tooltipText = getTooltipTextColor()

  return {
    text: { fill: axisColor, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 },
    grid: { line: { stroke: getCSSVar('--chart-grid') } },
    axis: {
      ticks: { text: { fill: axisColor, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 } },
      legend: { text: { fill: axisColor, fontFamily: '"JetBrains Mono", monospace', fontSize: 12 } },
    },
    tooltip: {
      container: {
        background: getCSSVar('--chart-tooltip-bg'),
        border: `1px solid ${getCSSVar('--chart-tooltip-border')}`,
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        color: tooltipText,
        backdropFilter: 'blur(12px)',
      },
    },
  }
}

export function getRechartsAxisStyle(isMobile = false) {
  return {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: isMobile ? 9 : 11,
    fill: getAxisColor(),
  }
}

export function getGridStroke() {
  return getCSSVar('--chart-grid')
}

export function getHeatmapNeutral() {
  return getCSSVar('--heatmap-neutral')
}

// Maps a bright series hex → the AA-safe ink TEXT class for its legend/tooltip LABEL.
// The bright hex stays on the swatch/dot/line; only text must clear WCAG AA in light mode
// (raw series hexes like green #4AF6C3 ≈ 1.4:1 on a white panel). The ink tokens are
// theme-aware: dark enough for light mode, bright again in dark mode.
export const INK_CLASS_BY_HEX = {
  '#0068FF': 'text-accent-ink-blue',
  '#4AF6C3': 'text-accent-ink-green',
  '#FF433D': 'text-accent-ink-red',
  '#FB8B1E': 'text-accent-ink-orange',
  '#D4A843': 'text-accent-ink-gold',
  '#A78BFA': 'text-accent-ink-purple',
}

export function inkClassForHex(hex) {
  return INK_CLASS_BY_HEX[String(hex || '').toUpperCase()] || 'text-text-secondary'
}
