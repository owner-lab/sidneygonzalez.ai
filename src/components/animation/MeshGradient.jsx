import useIsDark from '@/hooks/useIsDark'

export default function MeshGradient({ className = '' }) {
  const isDark = useIsDark()

  // Reduce opacity in light mode to avoid overwhelming the white background
  const o1 = isDark ? 0.3 : 0.1
  const o2 = isDark ? 0.2 : 0.07
  const o3 = isDark ? 0.15 : 0.05

  return (
    <div
      className={`absolute inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute -top-1/2 -left-1/4 h-[150%] w-[150%]"
        style={{
          opacity: isDark ? 0.3 : 0.15,
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(0, 104, 255, ${o1}) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(167, 139, 250, ${o2}) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(74, 246, 195, ${o3}) 0%, transparent 50%)
          `,
        }}
      />
    </div>
  )
}
