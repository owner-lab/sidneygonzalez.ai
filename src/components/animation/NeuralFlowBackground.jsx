import useIsDark from '@/hooks/useIsDark'

// Static, restrained backdrop for the /ai hero. The drifting "neural" particle
// canvas (an animated rAF graph) was removed — it was atmospheric motion the
// spec rejects (agency/WebGL anti-reference). What remains is a single quiet
// purple radial: the AI accent rendered as tonal depth, not spectacle. The
// hero earns its credibility from the manifesto headline and the live model.
export default function NeuralFlowBackground({ className = '' }) {
  const isDark = useIsDark()

  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 55% at 18% 10%, rgba(167, 139, 250, ${
            isDark ? 0.12 : 0.06
          }) 0%, transparent 62%)`,
        }}
      />
    </div>
  )
}
