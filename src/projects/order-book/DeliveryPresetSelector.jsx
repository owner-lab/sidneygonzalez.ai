import GlassPanel from '@/components/ui/GlassPanel'

function SlidersIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="5" cy="4" r="1.75" fill="currentColor" />
      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="8" r="1.75" fill="currentColor" />
      <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6" cy="12" r="1.75" fill="currentColor" />
    </svg>
  )
}

export default function DeliveryPresetSelector({ presets, activeId, onSelect }) {
  if (!presets || presets.length === 0) return null

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {presets.map((p, i) => {
        const isActive = activeId === p.id
        const isCustom = p.id === 'custom'

        let borderClass
        if (isActive) {
          borderClass = 'border-accent-blue ring-1 ring-accent-blue/30'
        } else if (isCustom) {
          borderClass = 'border-dashed border-border-medium hover:border-accent-blue/50'
        } else {
          borderClass = 'border-border-subtle hover:border-border-medium'
        }

        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            aria-pressed={isActive}
            className={`group text-left transition-all duration-200 ${isActive ? '' : 'hover:scale-[1.02]'}`}
          >
            <GlassPanel className={`h-full border ${borderClass}`}>
              <span
                className={`mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${
                  isActive ? 'text-accent-ink-blue' : 'text-text-muted'
                }`}
              >
                {isCustom && <SlidersIcon />}
                {isCustom ? 'Build Your Own' : `Scenario ${i + 1}`}
              </span>
              <p className="text-sm font-medium text-text-primary">{p.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">{p.description}</p>
            </GlassPanel>
          </button>
        )
      })}
    </div>
  )
}
