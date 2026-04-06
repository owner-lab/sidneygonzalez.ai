import ChartContainer from '@/components/charts/ChartContainer'
import GroupedBarChart from '@/components/charts/GroupedBarChart'

const DATA_KEYS = [
  { key: 'budget', color: '#0068FF', label: 'Budget' },
  { key: 'actual', color: '#4AF6C3', label: 'Actual' },
]

export default function VarianceBarChart({ data, loading }) {
  return (
    <ChartContainer
      title="Budget vs Actual by Department"
      subtitle="FY2025 total spend comparison"
      loading={loading}
      height={350}
    >
      <GroupedBarChart
        data={data}
        dataKeys={DATA_KEYS}
        xKey="department"
        height={300}
      />
    </ChartContainer>
  )
}
