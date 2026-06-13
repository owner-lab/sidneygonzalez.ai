import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { NAV_LINKS } from '@/config/constants'
import useLenisScroll from '@/hooks/useLenisScroll'
import useMediaQuery from '@/hooks/useMediaQuery'
import ThemeToggle from '@/components/ui/ThemeToggle'

// One nav entry, rendered correctly for the current location:
// - route entry (link.route)      → <Link to={link.to}>, active by pathname
// - anchor entry on Home           → <a href> with preventDefault + Lenis scroll
// - anchor entry off Home          → <Link to="/#section">, scrolled on arrival
//   (Phase-4 hash-on-arrival handles the scroll; Lenis can't reach an unmounted node)
function NavItem({
  link,
  onHome,
  activeSection,
  pathname,
  scrollTo,
  onNavigate,
  baseClass,
  activeClass,
  inactiveClass,
}) {
  const isActive = link.route
    ? pathname === link.to
    : onHome && activeSection === link.href.slice(1)
  const className = `${baseClass} ${isActive ? activeClass : inactiveClass}`
  const ariaCurrent = isActive ? 'page' : undefined

  if (link.route) {
    return (
      <Link to={link.to} onClick={onNavigate} aria-current={ariaCurrent} className={className}>
        {link.label}
      </Link>
    )
  }

  if (onHome) {
    return (
      <a
        href={link.href}
        onClick={(e) => {
          e.preventDefault()
          scrollTo(link.href)
          onNavigate?.()
        }}
        aria-current={ariaCurrent}
        className={className}
      >
        {link.label}
      </a>
    )
  }

  return (
    <Link to={`/${link.href}`} onClick={onNavigate} aria-current={ariaCurrent} className={className}>
      {link.label}
    </Link>
  )
}

export default function Navbar({ themePreference, onChangeTheme }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const scrollTo = useLenisScroll()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { pathname } = useLocation()
  const onHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (isDesktop) setMobileOpen(false)
  }, [isDesktop])

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Scrollspy: highlight the nav link for whichever section is in view.
  // Navbar lives in Layout and never unmounts, so this must RE-RUN on pathname
  // change — after /→/ai→/, Home remounts with fresh section nodes and a stale
  // observer would hold detached ones. Only Home has the sections, so no-op
  // elsewhere (the cleanup disconnects the prior observer first).
  useEffect(() => {
    if (pathname !== '/') return
    const ids = NAV_LINKS.filter((l) => l.href).map((l) => l.href.slice(1))
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [pathname])

  const closeMobile = () => setMobileOpen(false)

  return (
    <motion.nav
      className={`fixed top-0 z-50 w-full border border-transparent transition-all duration-300 ${
        scrolled ? 'navbar-glass' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {onHome ? (
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault()
              scrollTo('#hero')
              closeMobile()
            }}
            className="font-display text-lg font-semibold text-text-primary"
          >
            SG
          </a>
        ) : (
          <Link
            to="/"
            onClick={closeMobile}
            className="font-display text-lg font-semibold text-text-primary"
          >
            SG
          </Link>
        )}

        {/* Desktop nav + theme toggle */}
        <div className="hidden items-center gap-6 md:flex">
          <ul className="flex gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <NavItem
                  link={link}
                  onHome={onHome}
                  activeSection={activeSection}
                  pathname={pathname}
                  scrollTo={scrollTo}
                  onNavigate={closeMobile}
                  baseClass="text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-2"
                  activeClass="text-text-primary"
                  inactiveClass="text-text-secondary hover:text-text-primary"
                />
              </li>
            ))}
          </ul>
          <ThemeToggle preference={themePreference} onChangeTheme={onChangeTheme} />
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 rounded p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary md:hidden"
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
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <NavItem
                    link={link}
                    onHome={onHome}
                    activeSection={activeSection}
                    pathname={pathname}
                    scrollTo={scrollTo}
                    onNavigate={closeMobile}
                    baseClass="block rounded-lg px-4 py-3 text-sm transition-colors hover:bg-bg-hover hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                    activeClass="text-text-primary"
                    inactiveClass="text-text-secondary"
                  />
                </li>
              ))}
            </ul>
            <div className="border-t border-border-subtle px-4 py-3">
              <ThemeToggle preference={themePreference} onChangeTheme={onChangeTheme} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
