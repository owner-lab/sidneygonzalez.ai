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
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-bg-hover accent-accent-blue"
      />
    </div>
  )
}
