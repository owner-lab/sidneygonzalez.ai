/**
 * JS-accessible design tokens.
 * Accent colors are static (same in both themes).
 * Background/text colors should be read from CSS variables at runtime.
 */

export const accent = {
  blue: '#0068FF',
  green: '#4AF6C3',
  red: '#FF433D',
  orange: '#FB8B1E',
  purple: '#A78BFA',
}

// Categorical chart colors — non-semantic, for data series only.
// Purple is excluded (AI/intelligence semantic per Signal Rule).
export const chart = {
  gold: '#D4A843',
}

export const fonts = {
  display: '"Instrument Sans", system-ui, sans-serif',
  body: '"IBM Plex Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
}
