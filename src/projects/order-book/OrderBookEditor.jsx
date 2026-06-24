import { useState } from 'react'
import GlassPanel from '@/components/ui/GlassPanel'
import { formatCompact } from '@/utils/formatters'

const numberFmt = new Intl.NumberFormat('en-US')
const MAX_VALUE = 1_000_000_000 // $1B per-project guardrail

const inputCls =
  'w-full rounded border border-border-subtle bg-bg-surface/60 px-2 py-1.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/30'

// A labelled field so the table reads at any width (labels stay visible on mobile
// where a header row would be off-screen).
function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{label}</span>
      {children}
    </label>
  )
}

function MoneyCell({ label, value, onChange, ariaLabel }) {
  return (
    <Field label={label}>
      <div className="flex items-center rounded border border-border-subtle bg-bg-surface/60 px-2 transition-colors focus-within:border-accent-blue/50 focus-within:ring-1 focus-within:ring-accent-blue/30">
        <span className="text-xs text-text-muted">$</span>
        <input
          type="text"
          inputMode="numeric"
          aria-label={ariaLabel}
          value={numberFmt.format(value)}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, '')
            onChange(digits ? Math.min(Number(digits), MAX_VALUE) : 0)
          }}
          className="metric-value w-full bg-transparent px-1 py-1.5 text-right text-sm tabular-nums text-text-primary outline-none"
        />
      </div>
    </Field>
  )
}

export default function OrderBookEditor({ backlog, onProjectChange, onAddProject, onDeleteProject }) {
  const [open, setOpen] = useState(false)
  const total = backlog.reduce((s, p) => s + (Number(p.contract_value) || 0), 0)
  const slotMonths = backlog.reduce((s, p) => s + (Number(p.duration_months) || 0), 0)

  return (
    <GlassPanel className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Your Order Book</h4>
          <p className="mt-1 text-xs text-text-muted">
            <span className="metric-value tabular-nums text-text-secondary">{formatCompact(total)}</span> ·{' '}
            {backlog.length} project{backlog.length === 1 ? '' : 's'} · {slotMonths} team-months —{' '}
            <span className="text-accent-ink-blue">{open ? 'hide' : 'edit at your scale'}</span>
          </p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {!open ? null : (
      <div className="mt-4">
      <p className="mb-3 text-xs text-text-muted">
        Edit, add, or remove projects — this is your business, at your scale. The model runs live on
        whatever you enter.
      </p>
      {backlog.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-medium px-4 py-6 text-center text-sm text-text-muted">
          No projects yet — add one to begin modelling your book.
        </p>
      ) : (
        <div className="flex max-h-[460px] flex-col gap-3 overflow-y-auto pr-1" data-lenis-prevent>
          {backlog.map((p, i) => (
            <div key={p.id} className="rounded-lg border border-border-subtle bg-bg-surface/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <input
                  type="text"
                  aria-label={`Project ${i + 1} name`}
                  value={p.name ?? ''}
                  onChange={(e) => onProjectChange(i, 'name', e.target.value)}
                  className={`${inputCls} flex-1 font-medium`}
                  placeholder="Project name"
                />
                <button
                  type="button"
                  onClick={() => onDeleteProject(i)}
                  aria-label={`Remove ${p.name || 'project'}`}
                  className="shrink-0 rounded p-1.5 text-text-muted transition-colors hover:bg-accent-red/10 hover:text-accent-ink-red"
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 4h10M6.5 4V3h3v1M5 4l.5 9h5l.5-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <MoneyCell
                  label="Contract value"
                  ariaLabel={`Project ${i + 1} value`}
                  value={Number(p.contract_value) || 0}
                  onChange={(v) => onProjectChange(i, 'contract_value', v)}
                />
                <Field label="Margin %">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    aria-label={`Project ${i + 1} margin percent`}
                    value={Math.round((Number(p.gross_margin_pct) || 0) * 100)}
                    onChange={(e) => onProjectChange(i, 'gross_margin_pct', Math.min(100, Math.max(0, Number(e.target.value) || 0)) / 100)}
                    className={`${inputCls} metric-value tabular-nums`}
                  />
                </Field>
                <Field label="Duration (mo)">
                  <input
                    type="number"
                    min={1}
                    max={36}
                    aria-label={`Project ${i + 1} duration months`}
                    value={Number(p.duration_months) || 1}
                    onChange={(e) => onProjectChange(i, 'duration_months', Math.max(1, Math.round(Number(e.target.value) || 1)))}
                    className={`${inputCls} metric-value tabular-nums`}
                  />
                </Field>
                <Field label="Order in">
                  <input
                    type="month"
                    aria-label={`Project ${i + 1} order intake month`}
                    value={p.order_intake_date}
                    onChange={(e) => onProjectChange(i, 'order_intake_date', e.target.value || p.order_intake_date)}
                    className={`${inputCls} metric-value`}
                  />
                </Field>
                <Field label="Promised">
                  <input
                    type="month"
                    aria-label={`Project ${i + 1} promised delivery month`}
                    value={p.promised_delivery_date}
                    onChange={(e) => onProjectChange(i, 'promised_delivery_date', e.target.value || p.promised_delivery_date)}
                    className={`${inputCls} metric-value`}
                  />
                </Field>
                <Field label="Priority">
                  <select
                    aria-label={`Project ${i + 1} priority`}
                    value={Number(p.priority) || 3}
                    onChange={(e) => onProjectChange(i, 'priority', Number(e.target.value))}
                    className={inputCls}
                  >
                    <option value={1}>1 · highest</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5 · lowest</option>
                  </select>
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onAddProject}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border-medium px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent-blue/50 hover:text-accent-ink-blue"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add project
      </button>
      </div>
      )}
    </GlassPanel>
  )
}
