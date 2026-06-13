import Hero from '@/sections/Hero'
import About from '@/sections/About'
import Projects from '@/sections/Projects'
import BuildLog from '@/sections/BuildLog'
import Contact from '@/sections/Contact'

// The original single-page scroll body. Chrome (Lenis root, Navbar, Footer)
// lives in Layout; the live Pyodide demos inside Projects subscribe the
// usePyodide singleton themselves, so visiting Home still warms Pyodide.
export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Projects />
      <BuildLog />
      <Contact />
    </>
  )
}
