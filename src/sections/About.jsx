import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'

export default function About() {
  return (
    <Section id="about">
      <ScrollReveal>
        <h2 className="font-display text-display-md font-semibold">About</h2>
        <p className="mt-4 max-w-2xl text-text-secondary">
          The bridge between finance and technology. A financial analyst who
          builds the intelligence layer that helps executives understand what
          their company is trying to tell them about the decisions they&apos;re
          making.
        </p>
      </ScrollReveal>
    </Section>
  )
}
