import Section from '@/components/layout/Section'

// Phase 0 stub — proves routing, lazy chunking, and deep-link refresh work.
// The manifesto, ported ROI model, and luminous visuals land in later phases.
export default function AiValueTest() {
  return (
    <Section id="ai-hero" className="min-h-[85vh] pt-32">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
        The AI Value Test
      </p>
      <h1 className="mt-4 max-w-3xl font-display text-display-lg font-semibold">
        Value is earned, not assumed.
      </h1>
      <p className="mt-6 max-w-2xl text-text-secondary">
        A dedicated space for the economics of AI — coming together now.
      </p>
    </Section>
  )
}
