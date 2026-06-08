const colorMap = {
  blue: 'bg-accent-blue/10 text-accent-ink-blue border-accent-blue/20',
  green: 'bg-accent-green/10 text-accent-ink-green border-accent-green/20',
  red: 'bg-accent-red/10 text-accent-ink-red border-accent-red/20',
  orange: 'bg-accent-orange/10 text-accent-ink-orange border-accent-orange/20',
  purple: 'bg-accent-purple/10 text-accent-ink-purple border-accent-purple/20',
}

export default function Badge({ color = 'blue', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${colorMap[color]}`}
    >
      {children}
    </span>
  )
}
