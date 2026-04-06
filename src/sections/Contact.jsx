import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'
import GlassPanel from '@/components/ui/GlassPanel'
import { SOCIAL } from '@/config/constants'

const LINKS = [
  { label: 'GitHub', href: SOCIAL.github, external: true },
  { label: 'LinkedIn', href: SOCIAL.linkedin, external: true },
  { label: 'Email', href: SOCIAL.email, external: false },
]

export default function Contact() {
  return (
    <Section id="contact">
      <ScrollReveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-display-md font-semibold">
            Let&apos;s Talk
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Building an intelligence layer for your organization? Looking for
            someone who bridges finance and engineering? Let&apos;s connect.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="group"
                {...(link.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                <GlassPanel className="px-6 py-3 transition-all group-hover:border-accent-blue group-hover:shadow-lg group-hover:shadow-accent-blue/10">
                  <span className="text-sm font-medium text-text-primary group-hover:text-accent-blue">
                    {link.label}
                  </span>
                </GlassPanel>
              </a>
            ))}
          </div>

          <p className="mt-8 text-xs text-text-muted">
            Every project on this page runs live Python in your browser.
            No backend. No mock data. The engineering is the demo.
          </p>
        </div>
      </ScrollReveal>
    </Section>
  )
}
