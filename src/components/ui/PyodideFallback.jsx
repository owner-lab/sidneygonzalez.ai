import { useProjectCode } from '@/hooks/useProjectCode'

export default function PyodideFallback({ error }) {
  // null when rendered outside a project (e.g. the section-level fallback in
  // Projects.jsx), where there is no single pipeline to show.
  const openCode = useProjectCode()

  return (
    <div className="glass-panel rounded-xl p-8 text-center">
      <p className="text-sm text-text-secondary">
        Live demo unavailable
        {error && (
          <span className="mt-1 block text-xs text-text-muted">{error}</span>
        )}
      </p>
      {openCode && (
        <button
          type="button"
          onClick={openCode}
          className="mt-4 inline-block text-sm text-accent-ink-blue transition-colors hover:underline"
        >
          View the pipeline code
        </button>
      )}
    </div>
  )
}
