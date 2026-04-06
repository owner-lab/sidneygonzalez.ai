import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'
import GlassPanel from '@/components/ui/GlassPanel'
import Badge from '@/components/ui/Badge'

const DECISIONS = [
  {
    title: 'Why Pyodide Instead of a Backend',
    rationale:
      'Zero infrastructure means zero excuses. The Python code running in your browser is the same code a hiring manager reviews. No hidden server, no sanitized API — the engineering is the demo.',
    tag: 'shipped',
    tagColor: 'green',
  },
  {
    title: 'Why Synthetic Data Over Sanitized Real Data',
    rationale:
      'Real corporate data can\'t be shared. Sanitized data loses the patterns that make analysis interesting. Synthetic data with calibrated AR(1) autocorrelation, seasonal patterns, and research-backed margins gives full control while remaining defensible.',
    tag: 'validated',
    tagColor: 'blue',
  },
  {
    title: 'Why the Coefficient Network Matters',
    rationale:
      'The Decision Impact Analyzer\'s 16-edge DAG proves that no business decision exists in isolation. Cut marketing spend and watch pipeline contract two quarters later. This second-order thinking is the portfolio\'s thesis.',
    tag: 'shipped',
    tagColor: 'green',
  },
  {
    title: 'Why Isolation Forest Over Rule-Based Detection',
    rationale:
      'Rules catch what you already know to look for. Isolation Forest catches what you don\'t — trending overspends invisible at the monthly level, threshold gaming patterns too subtle for percentage thresholds. The ML adds signal the rules miss.',
    tag: 'shipped',
    tagColor: 'green',
  },
  {
    title: 'Why Pre-Computed Fallbacks',
    rationale:
      'Pyodide takes 3-8 seconds to load. That\'s 3-8 seconds of blank charts and lost attention. Fallback data renders instantly — the same structure the Python pipeline produces. Pyodide is a progressive enhancement, not a requirement.',
    tag: 'shipped',
    tagColor: 'green',
  },
  {
    title: 'Why Client-Side Filtering Over Re-Running Python',
    rationale:
      'Every Pyodide call costs 1-3 seconds. Run the full pipeline once, return the complete dataset, then filter in JavaScript with useMemo. Department selector, period toggle, anomaly type — all instant. The user never waits for Python twice.',
    tag: 'shipped',
    tagColor: 'green',
  },
  {
    title: 'Why the Custom Scenario Builder Runs Live Python',
    rationale:
      'Static preset scenarios tell the story. The builder proves the model actually works. Visitors tune marketing spend, engineering headcount, and operations budget, then watch the 16-edge DAG propagate their inputs in real time — the same Python engine that powers the presets, running on demand in-browser.',
    tag: 'shipped',
    tagColor: 'green',
  },
  {
    title: 'Why Smooth Scroll Requires a Contract',
    rationale:
      'Lenis intercepts all scroll events at the window level — that\'s the price of physics-based, buttery-smooth scroll behavior. Every scrollable sub-container (data tables, code panels, chart overflow) must declare data-lenis-prevent or Lenis steals the scroll and the element appears frozen. Modal overlays pause Lenis entirely instead. Global scroll ownership traded for a consistent feel — deliberate, not accidental.',
    tag: 'shipped',
    tagColor: 'green',
  },
]

export default function BuildLog() {
  return (
    <Section id="build-log">
      <ScrollReveal>
        <h2 className="font-display text-display-md font-semibold">
          Build Log
        </h2>
        <p className="mt-4 max-w-2xl text-text-secondary">
          The reasoning behind every technical choice. Each decision was made
          to maximize signal for the person reviewing this portfolio.
        </p>
      </ScrollReveal>

      <div className="relative mt-10">
        {/* Timeline spine (desktop only) */}
        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border-subtle md:block" />

        <div className="space-y-8 md:space-y-12">
          {DECISIONS.map((d, i) => {
            const isLeft = i % 2 === 0

            return (
              <ScrollReveal
                key={d.title}
                delay={i * 0.08}
                direction={isLeft ? 'right' : 'left'}
              >
                <div
                  className={`flex flex-col md:flex-row ${
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Card side */}
                  <div className="md:w-1/2 md:px-6">
                    <GlassPanel>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text-primary">
                          {d.title}
                        </h3>
                        <Badge color={d.tagColor}>{d.tag}</Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-text-secondary">
                        {d.rationale}
                      </p>
                    </GlassPanel>
                  </div>

                  {/* Spacer side (desktop only) */}
                  <div className="hidden md:block md:w-1/2" />
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
