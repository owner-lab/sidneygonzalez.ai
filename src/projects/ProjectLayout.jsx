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

        {/* View Code button */}
        <div className="mb-8 flex justify-end">
          <Button variant="secondary" onClick={() => setCodeOpen(true)}>
            View Code
          </Button>
        </div>

        {/* Formulas */}
        {formulas && <div className="mb-8">{formulas}</div>}

        {/* Limitations */}
        {limitations.length > 0 && (
          <div className="mt-8 border-t border-border-subtle pt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              Known Limitations
            </p>
            <ul className="space-y-1 text-xs text-text-muted">
              {limitations.map((item, i) => (
                <li key={i}>&bull; {item}</li>
              ))}
            </ul>
          </div>
        )}
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
