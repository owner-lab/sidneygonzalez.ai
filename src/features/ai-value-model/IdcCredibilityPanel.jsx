import GlassPanel from '@/components/ui/GlassPanel'
import { CREDIBILITY_STATS } from './fallbackData'

const ACCENT_TEXT = {
  blue: 'text-accent-ink-blue',
  green: 'text-accent-ink-green',
  red: 'text-accent-ink-red',
  orange: 'text-accent-ink-orange',
  purple: 'text-accent-ink-purple',
}

export default function IdcCredibilityPanel() {
  return (
    <GlassPanel className="mt-6 border border-accent-orange/20 bg-accent-orange/5">
      <div className="mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-ink-orange">
          Analyst context — IDC FutureScape 2026
        </h4>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          These are the predictions now shaping how CIOs, CFOs, and Chief AI Officers are judged
          on AI. The model above applies IDC&apos;s own value framework to exactly this question:
          is the investment going to pay off, and can you prove it?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {CREDIBILITY_STATS.map((s, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <span
              className={`metric-value font-display text-2xl font-semibold leading-none tabular-nums ${
                ACCENT_TEXT[s.accent] || 'text-text-primary'
              }`}
            >
              {s.stat}
            </span>
            <span className="text-xs leading-snug text-text-secondary">{s.claim}</span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto text-[11px] text-text-muted underline-offset-4 transition-colors hover:text-text-primary hover:underline"
            >
              {s.source} ↗
            </a>
          </div>
        ))}
      </div>

      <p className="mt-5 border-t border-border-subtle/60 pt-3 text-[11px] leading-relaxed text-text-muted">
        Forward-looking analyst predictions for Asia/Pacific Japan (2026–2030), each sourced and
        linked — directional context, not guarantees. Region and timeframe shown as published.
        Sources accessed June 2026.
      </p>
    </GlassPanel>
  )
}
