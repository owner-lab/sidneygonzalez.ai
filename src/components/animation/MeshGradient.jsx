import useIsDark from '@/hooks/useIsDark'

// A single, quiet tonal radial — depth from a near-surface tone, not a
// tri-accent wash. Was an animated blue/purple/green mesh: the generic-AI hero
// background the spec rejects (semantic accents used decoratively + atmospheric
// motion). Now static and accent-free, so the headline carries the hero.
export default function MeshGradient({ className = '' }) {
  const isDark = useIsDark()

  return (
    <div
      className={`absolute inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(60% 50% at 50% 0%, rgba(255, 255, 255, 0.035) 0%, transparent 65%)'
            : 'radial-gradient(60% 50% at 50% 0%, rgba(15, 23, 42, 0.035) 0%, transparent 65%)',
        }}
      />
    </div>
  )
}
