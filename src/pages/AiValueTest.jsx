import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'
import NeuralFlowBackground from '@/components/animation/NeuralFlowBackground'
import Button from '@/components/ui/Button'
import AiValueModel from '@/features/ai-value-model/AiValueModel'
import useLenisScroll from '@/hooks/useLenisScroll'
import useDocumentMeta from '@/hooks/useDocumentMeta'
import { SITE } from '@/config/constants'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}
const wordReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}
const noMotion = { hidden: { opacity: 1 }, visible: { opacity: 1 } }

// The thesis, told in three beats. Lead line is the claim; body is the defense.
const ESSAY = [
  {
    lead: 'Every AI budget is approved on a promise.',
    body: 'The promise is rarely the problem. The proof is. A pilot that dazzles in a demo and a program a CFO will fund are two different artifacts — and the gap between them is a number nobody wanted to write down.',
  },
  {
    lead: 'Most of that promise never ships.',
    body: 'Industry analysts expect half of AI initiatives to stall before they clear proof-of-concept, and more than 40% of agentic projects to be cancelled by 2027 — escalating cost, unclear value, weak controls. Not for lack of ambition. For lack of a defensible case.',
  },
  {
    lead: 'So measure the value, or miss it.',
    body: "IDC's 2026 framework reframes ROI as value times the probability you actually realize it. That single multiplier is the difference between a forecast you only hope for and one you can defend. The model below applies it live — change any assumption and the math recomputes, in real Python, in your browser.",
  },
]

// The four finance systems, framed as what AI-first automates. Anchors land
// back on the Home one-pager.
const SYSTEMS = [
  {
    title: 'Command Center',
    role: 'See the data',
    blurb: 'Executive KPIs and live financials — the ground truth an agent reasons over.',
    to: '/#command-center',
  },
  {
    title: 'Decision Analyzer',
    role: 'Model the decision',
    blurb: 'Scenario and impact modeling — the judgment an agent is trusted to make.',
    to: '/#decision-impact',
  },
  {
    title: 'Variance Engine',
    role: 'Find the anomaly',
    blurb: 'Anomaly and variance detection — the vigilance an agent runs around the clock.',
    to: '/#variance-engine',
  },
  {
    title: 'Order Book Forecaster',
    role: 'Forecast the book',
    blurb: 'Capacity scheduling and headcount ROI — the forward revenue an agent plans against.',
    to: '/#order-book',
  },
]

export default function AiValueTest() {
  useDocumentMeta({
    title: 'The AI Value Test | Sidney Gonzalez',
    description:
      'A working test of AI economics for CIOs, CFOs, and Chief AI Officers — a live, risk-adjusted ROI model on IDC’s 2026 framework. Value is earned, not assumed.',
    canonical: `${SITE.url}/ai`,
  })

  const reduced = useReducedMotion()
  const scrollTo = useLenisScroll()
  const v = reduced ? noMotion : null
  const headline = 'Value is earned, not assumed.'
  const words = headline.split(' ')

  return (
    <>
      {/* 1 — Manifesto hero */}
      <Section
        id="ai-hero"
        className="relative flex min-h-[85vh] items-center pt-24 sm:min-h-screen"
      >
        <NeuralFlowBackground />

        <motion.div variants={v || container} initial="hidden" animate="visible">
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink-purple"
            variants={v || fadeUp}
          >
            The AI Value Test
          </motion.p>

          <motion.h1
            className="mt-5 max-w-4xl font-display text-display-lg font-semibold md:text-display-xl"
            variants={v || container}
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                className={`mr-[0.25em] inline-block ${
                  word.startsWith('earned') ? 'text-accent-ink-purple' : ''
                }`}
                variants={v || wordReveal}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className="mt-6 max-w-2xl text-lg text-text-secondary md:text-xl"
            variants={v || fadeUp}
          >
            A working test of AI&apos;s economics for the people who have to defend
            it — CIOs, CFOs, and Chief AI Officers. Not a pitch — a risk-adjusted
            way to pressure-test the number before you stake a budget on it.
          </motion.p>

          <motion.div className="mt-8 flex flex-wrap gap-4" variants={v || fadeUp}>
            <Button onClick={() => scrollTo('#ai-model')}>Run the model</Button>
            <Link to="/#contact">
              <Button variant="secondary">Start a conversation</Button>
            </Link>
          </motion.div>
        </motion.div>
      </Section>

      {/* 2 — Essay / thesis */}
      <Section id="ai-thesis">
        <div className="mx-auto flex max-w-3xl flex-col gap-16">
          {ESSAY.map((block, i) => (
            <ScrollReveal key={i}>
              <p className="font-display text-display-sm font-semibold leading-tight text-text-primary md:text-display-md">
                {block.lead}
              </p>
              <p className="mt-4 text-lg leading-relaxed text-text-secondary">
                {block.body}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* 3 — The live model as evidence */}
      <Section id="ai-model">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-ink-purple">
            The test, live
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-display-sm font-semibold md:text-display-md">
            Put your own assumptions through it.
          </h2>
          <p className="mt-3 max-w-2xl text-text-secondary">
            This is a sensitivity model, not a forecast — it shows which
            assumption your business case is actually riding on. Every figure is
            computed in the browser from your inputs.
          </p>
        </ScrollReveal>
        <div className="mt-10">
          <AiValueModel variant="luminous" />
        </div>
      </Section>

      {/* 4 — The systems AI automates */}
      <Section id="ai-systems">
        <ScrollReveal>
          <h2 className="max-w-3xl font-display text-display-sm font-semibold md:text-display-md">
            The systems AI automates.
          </h2>
          <p className="mt-3 max-w-2xl text-text-secondary">
            The value above isn&apos;t abstract — it accrues on top of systems
            like these. Four live, Python-backed finance engines on the main
            site are exactly the work an AI-first layer is built to run.
          </p>
        </ScrollReveal>

        {/* A numbered sequence, not a marketing grid — these systems are a
            pipeline (See → Model → Find → Forecast), and the list reads as one. */}
        <div className="mt-10 border-t border-border-subtle">
          {SYSTEMS.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 0.08}>
              <Link
                to={s.to}
                className="group flex items-start gap-5 border-b border-border-subtle py-6 transition-colors hover:bg-bg-surface/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple/60 sm:gap-8"
              >
                <span className="metric-value shrink-0 text-sm leading-7 tabular-nums text-text-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent-ink-purple">
                    {s.role}
                  </span>
                  <h3 className="mt-1 font-display text-display-sm font-semibold text-text-primary">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-text-secondary">
                    {s.blurb}
                  </p>
                </div>
                <span className="hidden shrink-0 items-center gap-1.5 self-center text-sm font-medium text-accent-ink-purple transition-transform group-hover:translate-x-0.5 sm:inline-flex">
                  See it live
                  <span aria-hidden="true">&rarr;</span>
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </Section>

      {/* 5 — Final CTA */}
      <Section id="ai-cta" className="relative overflow-hidden">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-2xl border border-accent-purple/30 bg-bg-surface p-6 text-center">
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-70"
              style={{
                background:
                  'radial-gradient(90% 120% at 50% 0%, rgb(var(--accent-purple-ink) / 0.16), transparent 60%)',
              }}
              aria-hidden="true"
            />
            <h2 className="mx-auto max-w-2xl font-display text-display-sm font-semibold md:text-display-md">
              Value is earned. Let&apos;s earn yours.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              If you&apos;re sizing an AI investment and want to pressure-test the
              number before it goes in the room, that&apos;s the conversation I want to have.
            </p>
            <div className="mt-7 flex justify-center">
              <Link to="/#contact">
                <Button>Start a conversation</Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </Section>
    </>
  )
}
