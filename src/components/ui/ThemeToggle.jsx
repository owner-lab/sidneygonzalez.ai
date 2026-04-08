const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
]

export default function ThemeToggle({ preference, onChangeTheme }) {
  return (
    <div className="flex w-full items-center gap-1 rounded-lg bg-bg-surface p-1 sm:inline-flex sm:w-auto">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChangeTheme(opt.value)}
          className={`flex-1 rounded-md px-2.5 py-1 text-center text-xs font-medium transition-colors sm:flex-none ${
            preference === opt.value
              ? 'bg-bg-hover text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
          aria-label={`${opt.label} theme`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
