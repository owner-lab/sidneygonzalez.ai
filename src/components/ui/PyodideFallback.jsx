import { SOCIAL } from '@/config/constants'

export default function PyodideFallback({ error }) {
  return (
    <div className="glass-panel rounded-xl p-8 text-center">
      <p className="text-sm text-text-secondary">
        Live demo unavailable
        {error && (
          <span className="mt-1 block text-xs text-text-muted">{error}</span>
        )}
      </p>
      <a
        href={SOCIAL.github}
        className="mt-4 inline-block text-sm text-accent-blue transition-colors hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        View source on GitHub
      </a>
    </div>
  )
}
