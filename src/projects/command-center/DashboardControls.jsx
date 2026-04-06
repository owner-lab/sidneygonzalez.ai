import Button from '@/components/ui/Button'
import Toggle from '@/components/ui/Toggle'
import GlassPanel from '@/components/ui/GlassPanel'

const DIVISIONS = [
  { key: 'All', label: 'All Divisions', color: null },
  { key: 'Enterprise Software', label: 'Enterprise SW', color: '#0068FF' },
  { key: 'Professional Services', label: 'Prof Services', color: '#4AF6C3' },
  { key: 'Cloud Infrastructure', label: 'Cloud Infra', color: '#A78BFA' },
]

const PERIODS = [6, 12, 24]

export default function DashboardControls({
  division,
  onDivisionChange,
  period,
  onPeriodChange,
  showRawData,
  onShowRawDataChange,
}) {
  return (
    <GlassPanel className="mb-6 flex flex-col gap-4 p-3 md:flex-row md:items-center md:justify-between">
      {/* Division selector */}
      <div className="flex flex-wrap gap-1.5">
        {DIVISIONS.map(({ key, label, color }) => (
          <Button
            key={key}
            variant={division === key ? 'secondary' : 'ghost'}
            className="text-xs"
            onClick={() => onDivisionChange(key)}
          >
            {color && (
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
            {label}
          </Button>
        ))}
      </div>

      {/* Period selector */}
      <div className="flex gap-1.5">
        {PERIODS.map((p) => (
          <Button
            key={p}
            variant={period === p ? 'secondary' : 'ghost'}
            className="text-xs"
            onClick={() => onPeriodChange(p)}
          >
            {p}M
          </Button>
        ))}
      </div>

      {/* Raw data toggle */}
      <Toggle
        label="See the Raw Data"
        checked={showRawData}
        onChange={onShowRawDataChange}
      />
    </GlassPanel>
  )
}
