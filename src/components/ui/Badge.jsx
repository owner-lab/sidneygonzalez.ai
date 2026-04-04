const colorMap = {
  blue: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
  green: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  red: 'bg-accent-red/10 text-accent-red border-accent-red/20',
  orange: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20',
  purple: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
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
