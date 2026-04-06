import { useEffect, useRef } from 'react'
import ChartContainer from '@/components/charts/ChartContainer'
import MultiLineChart from '@/components/charts/MultiLineChart'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const LINE_KEYS = [
  { key: 'dso', color: '#0068FF', label: 'DSO' },
  { key: 'dpo', color: '#FB8B1E', label: 'DPO' },
  { key: 'dio', color: '#4AF6C3', label: 'DIO' },
  { key: 'ccc', color: '#A78BFA', label: 'CCC' },
]

const THRESHOLDS = [
  { value: 45, label: 'DSO benchmark', color: '#0068FF50' },
  { value: 30, label: 'DPO benchmark', color: '#FB8B1E50' },
]

const FORMULAS = [
  'CCC = DSO + DIO - DPO',
  'DSO = \\frac{AR}{Revenue} \\times 365',
  'EBITDA\\ Margin = \\frac{EBITDA}{Revenue} \\times 100',
]

function FormulaBlock() {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = FORMULAS.map(
      (f) => `<span class="mx-3">${katex.renderToString(f, { displayMode: false, throwOnError: false })}</span>`
    ).join('')
  }, [])

  return (
    <div
      ref={ref}
      className="mt-4 flex flex-wrap items-center gap-2 overflow-x-auto rounded-lg bg-bg-surface/50 px-3 py-3 text-xs text-text-secondary sm:px-4 sm:text-sm"
    />
  )
}

export default function WorkingCapitalHealth({ data, loading }) {
  return (
    <ChartContainer
      title="Working Capital Efficiency"
      subtitle="Days Sales Outstanding, Days Payable Outstanding, Days Inventory Outstanding"
      loading={loading}
      height={400}
    >
      <MultiLineChart
        data={data}
        lineKeys={LINE_KEYS}
        xKey="month"
        thresholds={THRESHOLDS}
        unit=" days"
        height={320}
      />
      <FormulaBlock />
    </ChartContainer>
  )
}
