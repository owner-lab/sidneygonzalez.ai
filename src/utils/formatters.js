/**
 * Format a number as currency with thousands separators.
 * @param {number} value
 * @returns {string} e.g. "$1,234,567"
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a number as a percentage.
 * @param {number} value
 * @param {number} decimals
 * @returns {string} e.g. "12.5%"
 */
export function formatPercent(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a variance value using accounting convention.
 * Positive: "$1,234", Negative: "($1,234)" with parentheses.
 * @param {number} value
 * @returns {string}
 */
export function formatVariance(value) {
  const abs = Math.abs(value)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs)

  if (value < 0) return `(${formatted})`
  return formatted
}

/**
 * Format a date consistently.
 * @param {Date|string} date
 * @param {'short'|'long'|'month-year'} format
 * @returns {string}
 */
export function formatDate(date, format = 'short') {
  const d = new Date(date)
  const options = {
    short: { month: 'short', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    'month-year': { month: 'long', year: 'numeric' },
  }
  return d.toLocaleDateString('en-US', options[format])
}

/**
 * Format a large number compactly.
 * @param {number} value
 * @returns {string} e.g. "$1.2M", "$450K"
 */
export function formatCompact(value) {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`
  return `${sign}$${abs.toFixed(0)}`
}
