import GlassPanel from '@/components/ui/GlassPanel'
import Slider from '@/components/ui/Slider'
import Button from '@/components/ui/Button'

const numberFmt = new Intl.NumberFormat('en-US')
const MAX_MONEY = 1_000_000_000 // $1B guardrail keeps the field and the math in scale

// Token-styled money input (the kit has no NumberInput primitive). Live comma grouping,
// so the dollar levers work for a $80K one-person team or a $2M fabrication crew alike.
function MoneyInput({ id, label, value, onChange }) {
  return (
    <div className="flex items-center rounded-lg border border-border-subtle bg-bg-surface/60 px-2.5 transition-colors focus-within:border-accent-blue/50 focus-within:ring-1 focus-within:ring-accent-blue/30">
      <span className="text-sm text-text-muted">$</span>
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
  )
}

// Live levers: a delivery-teams slider (the people lever), a cost-per-team money input
// (any scale), and the growth / delay / realization / discount sliders. Labels are the
// accessible names the tests query by — keep them in lockstep with the test file.
export default function CapacityControls({
  inputs,
  onFieldChange,
  onReset,
  pyodideReady,
  stressMode,
  onStressToggle,
}) {
  return (
    <GlassPanel className="mt-2">
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Delivery &amp; Investment Levers
      </h4>

      {/* THE people lever — the question, given its own highlighted row */}
      <div className="mb-5 rounded-lg border border-accent-blue/20 bg-accent-blue/5 p-4">
        <Slider
          label="Delivery teams"
          value={inputs.delivery_teams}
          min={1}
          max={12}
          step={1}
          onChange={(v) => onFieldChange('delivery_teams', v)}
          formatValue={(v) => `${v} team${v === 1 ? '' : 's'}`}
          showRange
        />
        <p className="mt-2 text-xs leading-relaxed text-text-muted">
          The investment decision: parallel delivery teams (a person, a pod, or a crew — whatever a
          unit of capacity is for you). ROI is measured against today&apos;s baseline of{' '}
          {inputs.baseline_teams} team{inputs.baseline_teams === 1 ? '' : 's'} — add capacity to
          convert late work to on-time and take on growth.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cost-per-team" className="text-xs font-medium text-text-secondary">
            Cost per team
          </label>
          <MoneyInput
            id="cost-per-team"
            label="Cost per team"
            value={inputs.cost_per_team}
            onChange={(v) => onFieldChange('cost_per_team', v)}
          />
          <span className="text-[11px] text-text-muted">Fully-loaded cost per team, per year.</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="fixed-cost-base" className="text-xs font-medium text-text-secondary">
            Fixed overhead (monthly)
          </label>
          <MoneyInput
            id="fixed-cost-base"
            label="Fixed overhead (monthly)"
            value={inputs.fixed_cost_base_monthly}
            onChange={(v) => onFieldChange('fixed_cost_base_monthly', v)}
          />
          <span className="text-[11px] text-text-muted">
            Rent, management, G&amp;A — costs that hold when the book thins.
          </span>
        </div>

        <Slider
          label="Order-intake growth"
          value={Math.round(inputs.order_intake_growth * 100)}
          min={0}
          max={30}
          step={1}
          onChange={(v) => onFieldChange('order_intake_growth', v / 100)}
          formatValue={(v) => `+${v}%`}
          showRange
        />
        <Slider
          label="Delay shock"
          value={inputs.delay_shock_months}
          min={0}
          max={6}
          step={1}
          onChange={(v) => onFieldChange('delay_shock_months', v)}
          formatValue={(v) => (v === 0 ? 'None' : `+${v} mo`)}
          showRange
        />
        <Slider
          label="Revenue realization"
          value={Math.round(inputs.revenue_realization * 100)}
          min={50}
          max={100}
          step={5}
          onChange={(v) => onFieldChange('revenue_realization', v / 100)}
          formatValue={(v) => `${v}%`}
          showRange
        />
        <div className="sm:col-span-2">
          <Slider
            label="Discount rate (NPV)"
            value={Math.round(inputs.discount_rate * 100)}
            min={0}
            max={20}
            step={1}
            onChange={(v) => onFieldChange('discount_rate', v / 100)}
            formatValue={(v) => (v === 0 ? 'Off (nominal)' : `${v}%`)}
            showRange
          />
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            Hurdle rate / WACC. Present-values the freed margin and recurring team cost so the return
            is a true NPV — at 0% the figures stay nominal. Late revenue is additionally haircut by the
            realization rate above.
          </p>
        </div>
      </div>

      {/* Stress test — separate from the planning levers; its own visual weight */}
      <div className="mt-5 rounded-lg border border-border-subtle bg-bg-hover/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-text-secondary">Downturn stress test</p>
            <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
              Applies Kangasluoma (2016) 2008–09 benchmarks to your book: contract values −20.86%
              (the measured backlog contraction) and the flagship slipped a further +3 months. Reveals
              the operating profit asymmetry — the mechanism behind the research finding that profit
              declines 2.7× faster than revenue.
            </p>
          </div>
          <button
            type="button"
            onClick={onStressToggle}
            aria-pressed={stressMode}
            className={[
              'mt-0.5 shrink-0 rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
              stressMode
                ? 'bg-impact-negative/15 text-impact-negative ring-1 ring-impact-negative/40'
                : 'bg-bg-surface text-text-muted ring-1 ring-border-subtle hover:text-text-secondary',
            ].join(' ')}
          >
            {stressMode ? 'On' : 'Run'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
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
  )
}
