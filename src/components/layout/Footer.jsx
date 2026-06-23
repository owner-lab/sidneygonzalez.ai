import { Link } from 'react-router-dom'

// Links route to absolute paths (and /#anchors) so they work identically from
// any page — on Home, the hash entries navigate in place and RouteScrollManager
// scrolls to the section; off Home they route back and scroll on arrival.
const FOOTER_LINKS = [
  { label: 'Projects', to: '/#projects' },
  { label: 'AI Value', to: '/ai' },
  { label: 'About', to: '/about' },
  { label: 'Build Log', to: '/build-log' },
  { label: 'Contact', to: '/#contact' },
]

export default function Footer() {
  return (
    <footer
      className="border-t border-border-subtle bg-bg-primary py-8"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-6">
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-xs text-text-muted underline-offset-4 transition-colors hover:text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mt-5 text-center text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Sidney Gonzalez. Built with React,
          Tailwind, and live Python.
        </p>
      </div>
    </footer>
  )
}
