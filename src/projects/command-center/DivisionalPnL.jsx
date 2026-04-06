import ChartContainer from '@/components/charts/ChartContainer'
import GroupedBarChart from '@/components/charts/GroupedBarChart'

const ALL_KEYS = [
  { key: 'Enterprise Software', color: '#0068FF', label: 'Enterprise Software' },
  { key: 'Professional Services', color: '#4AF6C3', label: 'Professional Services' },
  { key: 'Cloud Infrastructure', color: '#A78BFA', label: 'Cloud Infrastructure' },
]

export default function DivisionalPnL({ data, selectedDivision, loading }) {
  const dataKeys =
    selectedDivision === 'All'
      ? ALL_KEYS
      : ALL_KEYS.filter((k) => k.key === selectedDivision)

  return (
    <ChartContainer
      title="Revenue by Division"
      subtitle="Monthly revenue across business segments"
      loading={loading}
      height={350}
    >
      <GroupedBarChart
        data={data}
        dataKeys={dataKeys}
        xKey="month"
        height={300}
      />
    </ChartContainer>
  )
}
