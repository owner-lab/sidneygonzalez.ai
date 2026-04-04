import { SOCIAL } from '@/config/constants'

export default function Footer() {
  return (
    <footer
      className="border-t border-border-subtle bg-bg-primary py-12"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="mb-2 text-sm text-text-secondary">
          Let&apos;s build your organization&apos;s intelligence layer.
        </p>
        <div className="mb-6 flex justify-center gap-6">
          <a
            href={SOCIAL.github}
            className="text-sm text-text-muted transition-colors hover:text-accent-blue"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            GitHub
          </a>
          <a
            href={SOCIAL.linkedin}
            className="text-sm text-text-muted transition-colors hover:text-accent-blue"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            LinkedIn
          </a>
          <a
            href={SOCIAL.email}
            className="text-sm text-text-muted transition-colors hover:text-accent-blue"
            aria-label="Email"
          >
            Email
          </a>
        </div>
        <p className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Sidney Gonzalez. Built with React,
          Tailwind, and live Python.
        </p>
      </div>
    </footer>
  )
}
