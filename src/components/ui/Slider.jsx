export default function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  formatValue,
  className = '',
}) {
  const displayValue = formatValue ? formatValue(value) : value
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`

  // Center-origin fill: from 0 position toward current thumb
  const thumbPct = ((value - min) / (max - min)) * 100
  const zeroPct = ((0 - min) / (max - min)) * 100
  const fillLeft = Math.min(thumbPct, zeroPct)
  const fillWidth = Math.abs(thumbPct - zeroPct)
  const fillColor = value >= 0 ? '#0068FF' : '#FB8B1E'

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-text-secondary">
          {label}
        </label>
        <span className="metric-value text-xs text-text-primary">
          {displayValue}
        </span>
      </div>
      <div className="relative flex h-4 items-center">
        {/* Track */}
        <div className="pointer-events-none absolute h-1 w-full rounded-full bg-bg-hover" />
        {/* Fill from zero to thumb */}
        <div
          className="pointer-events-none absolute h-1 rounded-full"
          style={{
            left: `${fillLeft}%`,
            width: `${fillWidth}%`,
            backgroundColor: fillColor,
          }}
        />
        {/* Native input — transparent bg, on top for interaction */}
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
    </div>
  )
}
