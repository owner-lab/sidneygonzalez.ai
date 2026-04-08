export default function Footer() {
  return (
    <footer
      className="border-t border-border-subtle bg-bg-primary py-8"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Sidney Gonzalez. Built with React,
          Tailwind, and live Python.
        </p>
      </div>
    </footer>
  )
}
