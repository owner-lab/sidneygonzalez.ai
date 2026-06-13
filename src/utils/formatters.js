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
  if (value == null || !Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000_000_000) return `${sign}$${(abs / 1_000_000_000_000).toFixed(1)}T`
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`
  return `${sign}$${abs.toFixed(0)}`
}

/**
 * Accounting-style compact dollars: negatives as red-able parentheses.
 * e.g. 15044000 -> "$15.0M", -5200000 -> "($5.2M)"
 */
export function formatCompactAccounting(value) {
  if (value == null || !Number.isFinite(value)) return '—'
  const s = formatCompact(Math.abs(value))
  return value < 0 ? `(${s})` : s
}

/**
 * Scale-proof ROI percentage. Handles null/non-finite, signs the value,
 * groups thousands, and caps the display so extreme inputs never overflow.
 * e.g. 152 -> "+152%", 16352.4 -> "+16,352%", null -> "n/a"
 */
export function formatRoiPercent(value) {
  if (value == null || !Number.isFinite(value)) return 'n/a'
  const CAP = 100_000
  if (value >= CAP) return '≥ +100,000%'
  if (value <= -CAP) return '≤ -100,000%'
  const abs = Math.abs(value)
  const decimals = abs >= 100 ? 0 : 1
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`
}

/**
 * Value-to-cost multiple. Adaptive precision, grouped, capped.
 * e.g. 3.6 -> "3.60×", 164.5 -> "164×", null -> "n/a"
 */
export function formatMultiple(value) {
  if (value == null || !Number.isFinite(value)) return 'n/a'
  const CAP = 100_000
  if (value >= CAP) return '≥ 100,000×'
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}×`
}

/**
 * Format a large count compactly (no currency symbol).
 * @param {number} value
 * @returns {string} e.g. "5.2K", "1.3M"
 */
export function formatCount(value) {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return `${sign}${abs.toFixed(0)}`
}
