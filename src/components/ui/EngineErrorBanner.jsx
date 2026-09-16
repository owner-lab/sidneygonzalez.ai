import { useProjectCode } from '@/hooks/useProjectCode'

/**
 * Shown when a Pyodide engine fails and the surrounding UI falls back to static
 * figures. Must be rendered *below* a ProjectCodeContext provider to offer its
 * CTA — as a child of ProjectLayout, or inside a component that provides the
 * context itself.
 */
export default function EngineErrorBanner({ className = '' }) {
  const openCode = useProjectCode()

  return (
    <div
      className={`rounded-lg border border-border-subtle bg-bg-surface px-4 py-3 text-sm text-text-secondary ${className}`}
    >
      Live engine unavailable — the figures below are a static example and the
      sliders are inactive.{' '}
      {openCode && (
        <button
          type="button"
          onClick={openCode}
          className="text-accent-ink-blue hover:underline"
        >
          View the engine code
        </button>
      )}
    </div>
  )
}
