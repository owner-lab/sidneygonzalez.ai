import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'

export default function Contact() {
  return (
    <Section id="contact">
      <ScrollReveal>
        <h2 className="font-display text-display-md font-semibold">
          Contact
        </h2>
        <p className="mt-4 max-w-2xl text-text-secondary">
          Let&apos;s build your organization&apos;s intelligence layer.
        </p>
      </ScrollReveal>
    </Section>
  )
}
