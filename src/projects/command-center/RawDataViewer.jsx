import { useState } from 'react'
import GlassPanel from '@/components/ui/GlassPanel'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import useMediaQuery from '@/hooks/useMediaQuery'

const DIVISION_VARIANTS = new Set([
  'Div A', 'Division A', 'div_a',
  'Div B', 'Division B', 'div_b',
  'Div C', 'Division C', 'div_c',
])

function DataTable({ rows, title, titleColor, highlightIssues = false }) {
  if (!rows || rows.length === 0) return null
  const cols = Object.keys(rows[0])

  return (
    <div className="flex-1">
      <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wider ${titleColor}`}>
        {title}
      </h4>
      <div className="overflow-x-auto rounded-lg border border-border-subtle" data-lenis-prevent>
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-surface/50">
              {cols.map((col) => (
                <th key={col} className="whitespace-nowrap px-3 py-2 text-text-muted">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border-subtle last:border-0">
                {cols.map((col) => {
                  const val = row[col]
                  const isNull = val === null || val === undefined || val === ''
                  const isVariant = col === 'division' && highlightIssues && DIVISION_VARIANTS.has(val)
                  return (
                    <td
                      key={col}
                      className={`whitespace-nowrap px-3 py-1.5 ${
                        isNull && highlightIssues
                          ? 'bg-accent-orange/10 text-accent-orange'
                          : isVariant
                            ? 'bg-accent-red/10 text-accent-red'
                            : 'text-text-secondary'
                      }`}
                    >
                      {isNull ? '—' : typeof val === 'number' ? val.toLocaleString() : String(val)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function RawDataViewer({ rawSample, cleanSample, validationReport }) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [activeTab, setActiveTab] = useState('raw')

  if (!rawSample || !cleanSample) return null

  const report = validationReport || {}

  return (
    <GlassPanel className="mt-6">
      <h3 className="mb-4 font-display text-sm font-semibold text-text-primary">
        Pipeline: Raw Input vs Clean Output
      </h3>

      {/* Stats badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge color="blue">{report.rows_loaded || 0} rows loaded</Badge>
        <Badge color="orange">{report.nulls_found || 0} nulls found</Badge>
        <Badge color="red">{report.duplicates_removed || 0} dupes removed</Badge>
        <Badge color="purple">{report.division_variants_normalized || 0} names normalized</Badge>
      </div>

      {isMobile ? (
        /* Mobile: tab interface */
        <>
          <div className="mb-3 flex gap-1">
            <Button
              variant={activeTab === 'raw' ? 'secondary' : 'ghost'}
              className="text-xs"
              onClick={() => setActiveTab('raw')}
            >
              Raw Input
            </Button>
            <Button
              variant={activeTab === 'clean' ? 'secondary' : 'ghost'}
              className="text-xs"
              onClick={() => setActiveTab('clean')}
            >
              Clean Output
            </Button>
          </div>
          {activeTab === 'raw' ? (
            <DataTable rows={rawSample} title="Raw Input" titleColor="text-accent-red" highlightIssues />
          ) : (
            <DataTable rows={cleanSample} title="Clean Output" titleColor="text-accent-green" />
          )}
        </>
      ) : (
        /* Desktop: side-by-side */
        <div className="flex gap-4">
          <DataTable rows={rawSample} title="Raw Input" titleColor="text-accent-red" highlightIssues />
          <DataTable rows={cleanSample} title="Clean Output" titleColor="text-accent-green" />
        </div>
      )}
    </GlassPanel>
  )
}
