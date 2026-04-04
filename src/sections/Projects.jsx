import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'

export default function Projects() {
  return (
    <Section id="projects">
      <ScrollReveal>
        <h2 className="font-display text-display-md font-semibold">
          Projects
        </h2>
        <p className="mt-4 max-w-2xl text-text-secondary">
          Every project answers the same question: What is your company trying
          to tell you about the decisions you&apos;re making?
        </p>
      </ScrollReveal>
    </Section>
  )
}
