export default function Tooltip({ x, y, children, visible = true }) {
  if (!visible) return null

  return (
    <div
      className="glass-panel pointer-events-none fixed z-50 max-w-xs px-3 py-2 text-xs text-text-primary"
      style={{
        left: `${x + 12}px`,
        top: `${y - 12}px`,
      }}
      role="tooltip"
    >
      {children}
    </div>
  )
}
