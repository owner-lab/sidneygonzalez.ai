const states = {
  loading: {
    label: 'Loading Python...',
    color: 'text-accent-orange',
    bgColor: 'bg-accent-orange',
    pulse: true,
  },
  live: {
    label: 'Python Live',
    color: 'text-accent-green',
    bgColor: 'bg-accent-green',
    pulse: false,
  },
  offline: {
    label: 'Python Offline',
    color: 'text-text-muted',
    bgColor: 'bg-text-muted',
    pulse: false,
  },
}

export default function PyodideStatus({ status = 'offline' }) {
  const { label, color, bgColor, pulse } = states[status]
  return (
    <div
      className="metric-value inline-flex items-center gap-2 text-xs"
      role="status"
      aria-live="polite"
    >
      <span
        className={`h-2 w-2 rounded-full ${bgColor} ${pulse ? 'animate-pulse' : ''}`}
      />
      <span className={color}>{label}</span>
    </div>
  )
}
