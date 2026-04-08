import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'
import { SOCIAL } from '@/config/constants'

const MAILTO = `${SOCIAL.email}?subject=${encodeURIComponent(
  'Portfolio inquiry'
)}`

export default function Contact() {
  return (
    <Section id="contact">
      <ScrollReveal>
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-display-md font-semibold leading-tight">
            You&apos;ve seen the work.
            <br />
            Here&apos;s the conversation.
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-text-secondary">
            I&apos;m interviewing for{' '}
            <span className="text-text-primary">
              corporate finance, FP&amp;A, and finance business-partner roles
              in Toronto
            </span>{' '}
            — open to Montreal, New York, Chicago, and London for the right
            team. The work I&apos;m looking for is the kind where automating
            the close, re-platforming variance analysis, or building a
            driver-based planning model is on the table now, not a nice-to-have
            in year three.
          </p>

          <div className="mt-8 rounded-xl border border-border-subtle bg-bg-surface/50 p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-blue">
              Working sample, on request
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              If your team has a recurring analytical problem you can describe
              in a paragraph — a reporting bottleneck, a forecasting pain, a
              variance you can&apos;t explain — mention it in your email.
              I&apos;ll send back a 1-page note within 48 hours: how I&apos;d
              scope it, what the solution probably looks like, and an honest
              read on what&apos;s actually hard about it. No attachments
              required. No pitch. Just a working sample of how I think.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
            <a
              href={MAILTO}
              className="inline-flex items-center justify-center rounded-lg bg-accent-blue px-6 py-3 text-sm font-medium text-white shadow-lg shadow-accent-blue/25 transition-all hover:bg-accent-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
            >
              Email me directly
            </a>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <a
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 transition-colors hover:text-text-primary hover:underline"
              >
                Résumé / LinkedIn
              </a>
              <span aria-hidden="true" className="text-text-muted">
                ·
              </span>
              <a
                href={SOCIAL.github}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 transition-colors hover:text-text-primary hover:underline"
              >
                GitHub
              </a>
            </div>
          </div>

          <p className="mt-10 text-xs text-text-muted">
            Replies within 24 hours. Direct inquiries only — no recruiters or
            staffing agencies.
          </p>
        </div>
      </ScrollReveal>
    </Section>
  )
}
