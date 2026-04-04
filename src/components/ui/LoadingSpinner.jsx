export default function LoadingSpinner({ progress = 0, label = 'Initializing Python runtime' }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <div className="relative h-10 w-10">
        <svg className="h-10 w-10 animate-spin" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-bg-elevated"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${progress} ${100 - progress}`}
            strokeDashoffset="25"
            strokeLinecap="round"
            className="text-accent-blue"
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
