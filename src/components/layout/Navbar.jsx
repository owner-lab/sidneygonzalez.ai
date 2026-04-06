import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { NAV_LINKS } from '@/config/constants'
import useLenisScroll from '@/hooks/useLenisScroll'
import useMediaQuery from '@/hooks/useMediaQuery'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const scrollTo = useLenisScroll()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (isDesktop) setMobileOpen(false)
  }, [isDesktop])

  const handleNavClick = (e, href) => {
    e.preventDefault()
    scrollTo(href)
    setMobileOpen(false)
  }

  return (
    <motion.nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'glass-panel rounded-none' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, '#hero')}
          className="font-display text-lg font-semibold text-text-primary"
        >
          SG
        </a>

        {/* Desktop nav */}
        <ul className="hidden gap-8 md:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <motion.span
            className="block h-0.5 w-6 bg-text-primary"
            animate={mobileOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
          />
          <motion.span
            className="block h-0.5 w-6 bg-text-primary"
            animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
          />
          <motion.span
            className="block h-0.5 w-6 bg-text-primary"
            animate={
              mobileOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }
            }
          />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="glass-panel mx-4 mb-4 rounded-xl md:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={(e) => handleNavClick(e, href)}
                    className="block rounded-lg px-4 py-3 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
