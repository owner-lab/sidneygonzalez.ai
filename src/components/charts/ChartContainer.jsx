import GlassPanel from '@/components/ui/GlassPanel'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import PyodideFallback from '@/components/ui/PyodideFallback'

export default function ChartContainer({
  title,
  subtitle,
  height = 300,
  loading = false,
  error = null,
  children,
  className = '',
}) {
  return (
    <GlassPanel className={className}>
      {title && (
        <div className="mb-4">
          <h3 className="font-display text-sm font-semibold text-text-primary">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
          )}
        </div>
      )}

      <div style={{ minHeight: loading ? height : 'auto' }} className="relative">
        {loading ? (
          <SkeletonLoader lines={6} />
        ) : error ? (
          <PyodideFallback error={error} />
        ) : (
          children
        )}
      </div>
    </GlassPanel>
  )
}
