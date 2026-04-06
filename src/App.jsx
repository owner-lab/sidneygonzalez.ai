import { ReactLenis } from 'lenis/react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/sections/Hero'
import About from '@/sections/About'
import Projects from '@/sections/Projects'
import BuildLog from '@/sections/BuildLog'
import Contact from '@/sections/Contact'
import usePyodide from '@/python/usePyodide'

export default function App() {
  // Initialize Pyodide on page load (deferred — starts after hero paint)
  // Singleton: calling usePyodide() here and in child components shares one worker
  usePyodide()

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Projects />
        <BuildLog />
        <Contact />
      </main>
      <Footer />
    </ReactLenis>
  )
}
