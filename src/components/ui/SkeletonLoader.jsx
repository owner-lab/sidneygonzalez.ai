export default function SkeletonLoader({ className = '', lines = 3 }) {
  return (
    <div
      className={`animate-pulse space-y-3 ${className}`}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-bg-elevated"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
