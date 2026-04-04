import { ReactLenis } from 'lenis/react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'
import MeshGradient from '@/components/animation/MeshGradient'
import Button from '@/components/ui/Button'
import useLenisScroll from '@/hooks/useLenisScroll'
import { HERO, SOCIAL } from '@/config/constants'

export default function App() {
  const scrollTo = useLenisScroll()

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      <Navbar />

      <main>
        {/* Hero */}
        <Section id="hero" className="relative min-h-screen flex items-center">
          <MeshGradient />
          <ScrollReveal>
            <h1 className="font-display text-display-lg font-semibold md:text-display-xl">
              {HERO.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-text-secondary md:text-xl">
              {HERO.subtitle}
            </p>
            <p className="mt-3 text-sm text-text-muted">{HERO.supporting}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button onClick={() => scrollTo('#projects')}>
                Explore Projects
              </Button>
              <a
                href={SOCIAL.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary">View on GitHub</Button>
              </a>
            </div>
          </ScrollReveal>
        </Section>

        {/* About */}
        <Section id="about">
          <ScrollReveal>
            <h2 className="font-display text-display-md font-semibold">
              About
            </h2>
            <p className="mt-4 max-w-2xl text-text-secondary">
              The bridge between finance and technology. A financial analyst who
              builds the intelligence layer that helps executives understand what
              their company is trying to tell them about the decisions
              they&apos;re making.
            </p>
          </ScrollReveal>
        </Section>

        {/* Projects */}
        <Section id="projects">
          <ScrollReveal>
            <h2 className="font-display text-display-md font-semibold">
              Projects
            </h2>
            <p className="mt-4 max-w-2xl text-text-secondary">
              Every project answers the same question: What is your company
              trying to tell you about the decisions you&apos;re making?
            </p>
          </ScrollReveal>
        </Section>

        {/* Build Log */}
        <Section id="build-log">
          <ScrollReveal>
            <h2 className="font-display text-display-md font-semibold">
              Build Log
            </h2>
            <p className="mt-4 max-w-2xl text-text-secondary">
              Development decisions, methodology notes, and the reasoning behind
              every technical choice.
            </p>
          </ScrollReveal>
        </Section>

        {/* Contact */}
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
      </main>

      <Footer />
    </ReactLenis>
  )
}
