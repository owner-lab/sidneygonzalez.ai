import Section from '@/components/layout/Section'
import ScrollReveal from '@/components/animation/ScrollReveal'
import MeshGradient from '@/components/animation/MeshGradient'
import Button from '@/components/ui/Button'
import useLenisScroll from '@/hooks/useLenisScroll'
import { HERO, SOCIAL } from '@/config/constants'

export default function Hero() {
  const scrollTo = useLenisScroll()

  return (
    <Section id="hero" className="relative flex min-h-screen items-center">
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
  )
}
