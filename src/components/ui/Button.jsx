const variants = {
  primary:
    'bg-accent-blue text-white hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/25',
  secondary:
    'border border-border bg-bg-elevated text-text-primary hover:bg-bg-tertiary',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/5',
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
