import { motion, useReducedMotion } from 'motion/react'
import Section from '@/components/layout/Section'
import MeshGradient from '@/components/animation/MeshGradient'
import Button from '@/components/ui/Button'
import useLenisScroll from '@/hooks/useLenisScroll'
import { HERO, SOCIAL } from '@/config/constants'

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}

const wordStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
}

const wordReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

const noMotion = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
}

export default function Hero() {
  const scrollTo = useLenisScroll()
  const reduced = useReducedMotion()

  const words = HERO.title.split(' ')
  const v = reduced ? noMotion : null

  return (
    <Section id="hero" className="relative flex min-h-[85vh] items-center sm:min-h-screen">
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 2 }}
      >
        <MeshGradient />
      </motion.div>

      <motion.div
        variants={v || container}
        initial="hidden"
        animate="visible"
      >
        {/* Title — word-by-word stagger */}
        <motion.h1
          className="font-display text-display-lg font-semibold md:text-display-xl"
          variants={v || wordStagger}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="mr-[0.3em] inline-block"
              variants={v || wordReveal}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className="mt-4 max-w-2xl text-lg text-text-secondary md:text-xl"
          variants={v || fadeUp}
        >
          {HERO.subtitle}
        </motion.p>

        <motion.p
          className="mt-3 text-sm text-text-muted"
          variants={v || fadeUp}
        >
          {HERO.supporting}
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap gap-4"
          variants={v || fadeUp}
        >
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
        </motion.div>
      </motion.div>
    </Section>
  )
}
