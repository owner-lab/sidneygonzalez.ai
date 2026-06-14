import GlassPanel from '@/components/ui/GlassPanel'
import Slider from '@/components/ui/Slider'
import Button from '@/components/ui/Button'
import { BENEFIT_PARAMS, PRESETS } from './fallbackData'

const numberFmt = new Intl.NumberFormat('en-US')
// $1T guardrail — keeps the field tidy and the downstream math in scale no
// matter what is typed (output is still made robust to any value separately).
const MAX_MONEY = 1_000_000_000_000

// Token-styled money input (no NumberInput primitive exists in the kit).
// Live comma grouping so large figures read cleanly as they are typed.
function MoneyInput({ id, label, tag, value, onChange, title }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex min-w-0 items-center gap-1.5">
        {tag && (
          <span className="shrink-0 rounded bg-bg-hover px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-text-muted">
            {tag}
          </span>
        )}
        <label htmlFor={id} className="truncate text-xs font-medium text-text-secondary" title={title}>
          {label}
        </label>
      </div>
      <div className="flex items-center rounded-lg border border-border-subtle bg-bg-surface/60 px-2.5 transition-colors focus-within:border-accent-blue/50 focus-within:ring-1 focus-within:ring-accent-blue/30">
        <span className="text-xs text-text-muted">$</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          aria-label={label}
          value={numberFmt.format(value)}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, '')
            onChange(digits ? Math.min(Number(digits), MAX_MONEY) : 0)
          }}
          className="metric-value w-full bg-transparent px-1.5 py-2 text-right text-sm tabular-nums text-text-primary outline-none"
        />
      </div>
    </div>
  )
}

export default function RoiInputsPanel({
  inputs,
  onBenefitChange,
  onFieldChange,
  onApplyPreset,
  onReset,
  pyodideReady,
}) {
  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Start from a profile
        </span>
        {PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="ghost"
            className="text-xs"
            title={preset.description}
            onClick={() => onApplyPreset(preset.inputs)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Nine IDC benefit value lines */}
      <GlassPanel>
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            AI Business Value — annual $ by benefit
          </h4>
          <p className="mt-1 text-xs text-text-muted">
            IDC&apos;s nine AI Business Value Benefit parameters. Enter the annual value you
            expect from each; the Direct / Indirect split is applied below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFIT_PARAMS.map((b) => (
            <MoneyInput
              key={b.id}
              id={`benefit-${b.id}`}
              label={b.name}
              tag={b.tag}
              title={b.hint}
              value={inputs.benefits[b.id] ?? 0}
              onChange={(val) => onBenefitChange(b.id, val)}
            />
          ))}
        </div>
      </GlassPanel>

      {/* Cost & risk assumptions */}
      <GlassPanel>
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Cost &amp; Risk Assumptions
        </h4>

        <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
          <MoneyInput
            id="initial-cost"
            label="Initial investment (one-time)"
            tag="CAPEX"
            title="Build, integration, and change-management cost."
            value={inputs.initial_cost}
            onChange={(val) => onFieldChange('initial_cost', val)}
          />
          <MoneyInput
            id="annual-cost"
            label="Annual operating cost"
            tag="OPEX"
            title="Licenses, inference, MLOps, monitoring, support."
            value={inputs.annual_cost}
            onChange={(val) => onFieldChange('annual_cost', val)}
          />
          {/* Full-width on their own rows (sm:col-span-2) so the two tracks
              never sit side-by-side and read as one dual-handle bar. */}
          <Slider
            className="sm:col-span-2"
            label="Direct value share"
            value={Math.round(inputs.direct_ratio * 100)}
            min={0}
            max={100}
            step={5}
            onChange={(v) => onFieldChange('direct_ratio', v / 100)}
            formatValue={(v) => `${v}% direct`}
            showRange
          />
          <Slider
            className="sm:col-span-2"
            label="Time horizon"
            value={inputs.years}
            min={1}
            max={7}
            step={1}
            onChange={(v) => onFieldChange('years', v)}
            formatValue={(v) => `${v} yr${v > 1 ? 's' : ''}`}
            showRange
          />
          <div className="sm:col-span-2">
            <Slider
              label="Discount rate (NPV)"
              value={Math.round((inputs.discount_rate ?? 0) * 100)}
              min={0}
              max={20}
              step={1}
              onChange={(v) => onFieldChange('discount_rate', v / 100)}
              formatValue={(v) => (v === 0 ? 'Off (nominal)' : `${v}%`)}
              showRange
            />
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              Optional hurdle rate / WACC. Present-values future value and operating cost so
              the multiple is a true NPV — at 0% the figures stay nominal.
            </p>
          </div>
        </div>

        {/* Success probability — the risk multiplier that defines IDC's redefined ROI */}
        <div className="mt-6 rounded-lg border border-accent-orange/20 bg-accent-orange/5 p-4">
          <Slider
            label="Probability you realize the value"
            value={Math.round(inputs.success_probability * 100)}
            min={0}
            max={100}
            step={1}
            onChange={(v) => onFieldChange('success_probability', v / 100)}
            formatValue={(v) => `${v}%`}
            showRange
          />
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            Your assumption — the odds the projected value is actually realized, given how many
            AI initiatives stall before production. This is the risk multiplier that turns a
            headline business case into IDC&apos;s risk-adjusted ROI.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button variant="ghost" className="text-xs" onClick={onReset}>
            Reset to defaults
          </Button>
          {!pyodideReady && (
            <span className="text-xs text-text-muted">
              Live Python runtime not ready — showing reference scenario…
            </span>
          )}
        </div>
      </GlassPanel>
    </div>
  )
}
