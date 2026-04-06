import GlassPanel from '@/components/ui/GlassPanel'

export default function ScenarioSelector({ scenarios, activeId, onSelect }) {
  if (!scenarios || scenarios.length === 0) return null

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {scenarios.map((s) => {
        const isActive = activeId === s.id
        const isCustom = s.id === 'custom'

        return (
          <button
            key={s.id}
            onClick={() => onSelect(isActive ? null : s.id)}
            className={`group text-left transition-all duration-200 ${
              isActive ? '' : 'hover:scale-[1.02]'
            }`}
          >
            <GlassPanel
              className={`h-full ${
                isActive
                  ? 'border-accent-blue ring-1 ring-accent-blue/30'
                  : 'border-border-subtle hover:border-border-medium'
              }`}
            >
              <span
                className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${
                  isActive ? 'text-accent-blue' : 'text-text-muted'
                }`}
              >
                {isCustom ? 'Build Your Own' : `Scenario ${scenarios.indexOf(s) + 1}`}
              </span>
              <p className="text-sm font-medium text-text-primary">{s.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                {s.description}
              </p>
            </GlassPanel>
          </button>
        )
      })}
    </div>
  )
}
