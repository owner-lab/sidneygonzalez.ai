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

export default function VarianceControls({ department, onDepartmentChange }) {
  return (
    <GlassPanel className="mb-6 p-3">
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
    </GlassPanel>
  )
}
