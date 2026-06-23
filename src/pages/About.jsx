import { Link } from 'react-router-dom'
import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import useDocumentMeta from '@/hooks/useDocumentMeta'
import { SITE } from '@/config/constants'

const STACK = [
  { label: 'Python', color: 'green' },
  { label: 'React', color: 'blue' },
  { label: 'Pandas', color: 'green' },
  { label: 'Pyodide', color: 'purple' },
  { label: 'Recharts', color: 'blue' },
  { label: 'Nivo', color: 'orange' },
  { label: 'scikit-learn', color: 'red' },
  { label: 'Tailwind', color: 'blue' },
]

// A dedicated page rather than a Home section: the homepage is the data story,
// and "who built it" is context the reader chooses to open — never an
// interruption between the work and the conversation.
export default function About() {
  useDocumentMeta({
    title: 'About | Sidney Gonzalez',
    description:
      'Financial analyst building the intelligence layer between raw corporate data and executive decision-making.',
    canonical: `${SITE.url}/about`,
  })

  return (
    <Section id="about" className="pt-28 md:pt-32">
      <ScrollReveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
          About
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-display-md font-semibold md:text-display-lg">
          I build the intelligence layer between data and the decision.
        </h1>
      </ScrollReveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ScrollReveal delay={0.1}>
            <p className="text-lg leading-relaxed text-text-secondary">
              Financial analyst who builds the intelligence layer between raw
              corporate data and executive decision-making. The gap between
              what a company&apos;s data says and what leadership acts on is
              where value gets left on the table.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="mt-4 text-text-secondary">
              The projects on this site are the proof of concept — real
              financial logic, real data pipelines, real ML running live in
              your browser. No backend, no mock data, no shortcuts. The same
              Python code you see in the &ldquo;View Code&rdquo; tabs is
              executing right now via Pyodide.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="mt-4 text-sm text-text-muted">
              Targeting Finance Director, CFO, and COO organizations where the
              bridge between finance teams and engineering determines how fast
              the company learns from its own data.
            </p>
          </ScrollReveal>
        </div>

        <div className="lg:col-span-2">
          <ScrollReveal delay={0.2}>
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Built With
              </h2>
              <div className="flex flex-wrap gap-2">
                {STACK.map((s) => (
                  <Badge key={s.label} color={s.color}>
                    {s.label}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 space-y-2 text-xs text-text-muted">
                <p>Live Python computation in the browser</p>
                <p>Zero backend — the code IS the demo</p>
                <p>Every number is defensible</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Never a dead end — funnel back to the work, with the reasoning one click away. */}
      <ScrollReveal delay={0.2}>
        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-border-subtle pt-8">
          <Link to="/#projects">
            <Button>See the systems</Button>
          </Link>
          <Link to="/build-log">
            <Button variant="secondary">Read the build log</Button>
          </Link>
        </div>
      </ScrollReveal>
    </Section>
  )
}
