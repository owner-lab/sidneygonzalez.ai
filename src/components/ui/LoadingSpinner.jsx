const RADIUS = 16
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function LoadingSpinner({ progress = 0, label = 'Initializing Python runtime' }) {
  const filled = (progress / 100) * CIRCUMFERENCE
  const gap = CIRCUMFERENCE - filled

  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <div className="relative h-10 w-10">
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-bg-hover"
          />
          <circle
            cx="20"
            cy="20"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${filled} ${gap}`}
            strokeLinecap="round"
            className="text-accent-blue transition-all duration-300"
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-xs text-text-secondary">{label}</p>
        {progress > 0 && (
          <p className="metric-value text-xs text-accent-blue">{Math.round(progress)}%</p>
        )}
      </div>
    </div>
  )
}
