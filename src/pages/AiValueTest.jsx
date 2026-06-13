import Section from '@/components/layout/Section'
import AiValueModel from '@/features/ai-value-model/AiValueModel'

// Phase 1 — proves routing, lazy chunking, deep-link refresh, AND that the
// ported ROI model computes/renders on the new baseline. The manifesto essay
// blocks, "systems AI automates" cards, and luminous visuals land in Phase 5.
export default function AiValueTest() {
  return (
    <>
      <Section id="ai-hero" className="min-h-[60vh] pt-32">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-ink-purple">
          The AI Value Test
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-display-lg font-semibold">
          Value is earned, not assumed.
        </h1>
        <p className="mt-6 max-w-2xl text-text-secondary">
          A dedicated space for the economics of AI — coming together now.
        </p>
      </Section>

      <Section id="ai-model">
        <AiValueModel variant="luminous" />
      </Section>
    </>
  )
}
