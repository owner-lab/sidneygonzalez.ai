import Hero from '@/sections/Hero'
import Projects from '@/sections/Projects'
import Contact from '@/sections/Contact'
import useDocumentMeta from '@/hooks/useDocumentMeta'
import { SITE } from '@/config/constants'

// The homepage is a single guided story: who (Hero) → the proof (Projects, the
// live data narrative + the AI Value bridge) → the conversation (Contact).
// About and the Build Log are deliberately their own routes (/about, /build-log)
// so this page reads as one goal-directed scroll, not a wall of sections.
export default function Home() {
  useDocumentMeta({
    title: SITE.title,
    description: SITE.description,
    canonical: `${SITE.url}/`,
  })

  return (
    <>
      <Hero />
      <Projects />
      <Contact />
    </>
  )
}
