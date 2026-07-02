import { inkClassForHex } from '@/config/chartTheme'

// AA-safe chart legend for Recharts. The default <Legend> colors each series' LABEL TEXT
// with the series' bright stroke/fill hex, which is unreadable in light mode (green ≈ 1.4:1
// on a white panel). This renders the label TEXT in the matching AA-safe ink class and keeps
// the bright hex only on the swatch. Drop-in usage: <Legend content={<AALegend />} />.
export default function AALegend({ payload }) {
  if (!payload?.length) return null
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3">
      {payload.map((entry) => (
        <li
          key={entry.dataKey ?? entry.value}
          className={`flex items-center gap-1.5 text-[11px] ${inkClassForHex(entry.color)}`}
        >
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          {entry.value}
        </li>
      ))}
    </ul>
  )
}
