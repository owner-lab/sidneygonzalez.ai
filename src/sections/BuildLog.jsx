import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'

export default function BuildLog() {
  return (
    <Section id="build-log">
      <ScrollReveal>
        <h2 className="font-display text-display-md font-semibold">
          Build Log
        </h2>
        <p className="mt-4 max-w-2xl text-text-secondary">
          Development decisions, methodology notes, and the reasoning behind
          every technical choice.
        </p>
      </ScrollReveal>
    </Section>
  )
}
