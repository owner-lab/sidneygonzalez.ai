import Button from '@/components/ui/Button'
import GlassPanel from '@/components/ui/GlassPanel'

const DEPARTMENTS = [
  { key: 'All', label: 'All Departments' },
  { key: 'Engineering', label: 'Engineering' },
  { key: 'Sales', label: 'Sales' },
  { key: 'Marketing', label: 'Marketing' },
  { key: 'Operations', label: 'Operations' },
  { key: 'Finance', label: 'Finance' },
]

const ANOMALY_TYPES = [
  { key: 'All', label: 'All Types' },
  { key: 'trending_overspend', label: 'Trending', color: 'red' },
  { key: 'seasonal_spike', label: 'Seasonal', color: 'orange' },
  { key: 'threshold_cluster', label: 'Threshold', color: 'purple' },
  { key: 'duplicate_payment', label: 'Duplicate', color: 'blue' },
  { key: 'one_time_event', label: 'One-Time', color: 'green' },
]

export default function VarianceControls({
  department,
  onDepartmentChange,
  anomalyType,
  onAnomalyTypeChange,
}) {
  return (
    <GlassPanel className="mb-6 flex flex-col gap-4 p-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Department filter */}
      <div className="flex flex-wrap gap-1.5">
        {DEPARTMENTS.map(({ key, label }) => (
          <Button
            key={key}
            variant={department === key ? 'secondary' : 'ghost'}
            className="text-xs"
            onClick={() => onDepartmentChange(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Anomaly type filter */}
      <div className="flex flex-wrap gap-1.5">
        {ANOMALY_TYPES.map(({ key, label }) => (
          <Button
            key={key}
            variant={anomalyType === key ? 'secondary' : 'ghost'}
            className="text-xs"
            onClick={() => onAnomalyTypeChange(key)}
          >
            {label}
          </Button>
        ))}
      </div>
    </GlassPanel>
  )
}
