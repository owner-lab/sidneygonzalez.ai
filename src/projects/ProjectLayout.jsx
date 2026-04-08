import { useState } from 'react'
import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'
import GlassPanel from '@/components/ui/GlassPanel'
import Badge from '@/components/ui/Badge'
import CodeToggle from '@/components/ui/CodeToggle'
import PyodideStatus from '@/components/ui/PyodideStatus'
import Button from '@/components/ui/Button'

export default function ProjectLayout({
  id,
  number,
  title,
  subtitle,
  question,
  badges = [],
  pyodideStatus = 'offline',
  codeByTab = {},
  limitations = [],
  formulas,
  children,
}) {
  const [codeOpen, setCodeOpen] = useState(false)

  return (
    <Section id={id}>
      <ScrollReveal>
        {/* Header */}
        <div className="mb-8">
          <span className="mb-2 block text-sm font-medium text-accent-blue">
            Project {number}
          </span>
          <h3 className="font-display text-display-sm font-semibold md:text-display-md">
            {title}
          </h3>
          <p className="mt-1 text-sm italic text-text-muted">{subtitle}</p>
        </div>

        {/* Business question */}
        <GlassPanel className="mb-8">
          <p className="text-sm leading-relaxed text-text-secondary">
            <span className="font-semibold text-text-primary">
              Business Question:{' '}
            </span>
            {question}
          </p>
        </GlassPanel>

        {/* Tech badges + Pyodide status */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {badges.map((badge) => (
            <Badge key={badge.label} color={badge.color}>
              {badge.label}
            </Badge>
          ))}
          <div className="ml-auto">
            <PyodideStatus status={pyodideStatus} />
          </div>
        </div>

        {/* Demo area — project-specific content */}
        <div className="mb-8">{children}</div>

        {/* Formulas */}
        {formulas && <div className="mb-8">{formulas}</div>}

        {/* Project closing card — View Code + Known Limitations */}
        <GlassPanel className="mt-10">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <svg
                  className="h-4 w-4 shrink-0 text-accent-blue"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <line
                    x1="8"
                    y1="7"
                    x2="8"
                    y2="11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="4.75" r="0.85" fill="currentColor" />
                </svg>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                  Known Limitations
                </h4>
              </div>
              <p className="text-xs text-text-muted">
                What would change if this were deployed for real users.
              </p>
            </div>
            <Button variant="secondary" onClick={() => setCodeOpen(true)}>
              View Code
            </Button>
          </div>

          {limitations.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {limitations.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm leading-relaxed text-text-secondary"
                >
                  <span className="shrink-0 text-accent-blue" aria-hidden="true">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </ScrollReveal>

      {/* Code slide-out */}
      <CodeToggle
        isOpen={codeOpen}
        onClose={() => setCodeOpen(false)}
        codeByTab={codeByTab}
      />
    </Section>
  )
}
