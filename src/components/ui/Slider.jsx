export default function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  formatValue,
  showRange = false,
  divisionLabel = null,
  className = '',
}) {
  const displayValue = formatValue ? formatValue(value) : value
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`

  const thumbPct = ((value - min) / (max - min)) * 100
  const zeroPct = ((0 - min) / (max - min)) * 100
  const fillLeft = Math.min(thumbPct, zeroPct)
  const fillWidth = Math.abs(thumbPct - zeroPct)

  // Only apply directional coloring when range includes negative values
  const hasNegativeRange = min < 0
  const isNeg = hasNegativeRange && value < 0
  const isZero = value === 0

  const fillColor = isZero ? 'transparent' : isNeg ? '#FB8B1E' : '#0068FF'
  const valueColorClass = !hasNegativeRange
    ? 'text-text-primary'
    : isZero
      ? 'text-text-muted'
      : isNeg
        ? 'text-accent-orange'
        : 'text-accent-blue'

  // Zero tick only meaningful when 0 is strictly inside the range
  const showZeroTick = hasNegativeRange && zeroPct > 0 && zeroPct < 100

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {divisionLabel && (
            <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-bg-hover text-text-muted">
              {divisionLabel}
            </span>
          )}
          <label htmlFor={id} className="truncate text-xs font-medium text-text-secondary">
            {label}
          </label>
        </div>
        <span className={`shrink-0 metric-value text-xs font-semibold tabular-nums ${valueColorClass}`}>
          {displayValue}
        </span>
      </div>

      <div className="relative flex h-5 items-center">
        {/* Track */}
        <div className="pointer-events-none absolute h-1.5 w-full rounded-full bg-bg-hover" />
        {/* Zero center tick — appears when thumb moves away from 0 */}
        {showZeroTick && (
          <div
            className="pointer-events-none absolute h-3.5 w-0.5 rounded-full bg-text-muted/30"
            style={{ left: `${zeroPct}%`, transform: 'translateX(-50%)' }}
          />
        )}
        {/* Fill from zero toward thumb */}
        <div
          className="pointer-events-none absolute h-1.5 rounded-full"
          style={{
            left: `${fillLeft}%`,
            width: `${fillWidth}%`,
            backgroundColor: fillColor,
          }}
        />
        {/* Native input — transparent, on top for interaction */}
        <input
          id={id}
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
            [&::-moz-range-track]:bg-transparent
            [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md"
        />
      </div>

      {showRange && (
        <div className="flex justify-between" aria-hidden="true">
          <span className="text-[9px] text-text-muted/60">
            {formatValue ? formatValue(min) : min}
          </span>
          <span className="text-[9px] text-text-muted/60">
            {formatValue ? formatValue(max) : max}
          </span>
        </div>
      )}
    </div>
  )
}
