export default function Toggle({ label, checked, onChange, className = '' }) {
  const id = `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-accent-blue' : 'bg-bg-hover'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <label
        htmlFor={id}
        className="cursor-pointer text-xs font-medium text-text-secondary"
      >
        {label}
      </label>
    </div>
  )
}
