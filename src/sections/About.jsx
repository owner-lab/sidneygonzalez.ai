import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'
import Badge from '@/components/ui/Badge'
import GlassPanel from '@/components/ui/GlassPanel'

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

export default function About() {
  return (
    <Section id="about">
      <ScrollReveal>
        <h2 className="font-display text-display-md font-semibold">About</h2>
      </ScrollReveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
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
              The three projects below are the proof of concept — real financial
              logic, real data pipelines, real ML running live in your browser.
              No backend, no mock data, no shortcuts. The same Python code you
              see in the &ldquo;View Code&rdquo; tabs is executing right now via
              Pyodide.
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
            <GlassPanel>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Built With
              </h3>
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
            </GlassPanel>
          </ScrollReveal>
        </div>
      </div>
    </Section>
  )
}
