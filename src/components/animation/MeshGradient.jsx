export default function MeshGradient({ className = '' }) {
  return (
    <div
      className={`absolute inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute -top-1/2 -left-1/4 h-[150%] w-[150%] opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(0, 104, 255, 0.3) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(167, 139, 250, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(74, 246, 195, 0.15) 0%, transparent 50%)
          `,
        }}
      />
    </div>
  )
}
