/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'rgb(var(--color-bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-bg-secondary) / <alpha-value>)',
          surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
          hover: 'rgb(var(--color-bg-hover) / <alpha-value>)',
        },
        accent: {
          blue: '#0068FF',
          green: '#4AF6C3',
          red: '#FF433D',
          orange: '#FB8B1E',
          purple: '#A78BFA',
        },
        // Accent "ink" — theme-aware, AA-contrast accents for TEXT use.
        'accent-ink': {
          blue: 'rgb(var(--accent-blue-ink) / <alpha-value>)',
          green: 'rgb(var(--accent-green-ink) / <alpha-value>)',
          red: 'rgb(var(--accent-red-ink) / <alpha-value>)',
          orange: 'rgb(var(--accent-orange-ink) / <alpha-value>)',
          purple: 'rgb(var(--accent-purple-ink) / <alpha-value>)',
          gold: 'rgb(var(--accent-gold-ink) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          medium: 'var(--color-border-medium)',
        },
        // Impact = financial +/- semantics, rendered as TEXT — point at the
        // theme-aware ink tokens so accounting figures meet WCAG AA in light
        // mode while keeping the bright accents on dark surfaces.
        impact: {
          positive: 'rgb(var(--accent-green-ink) / <alpha-value>)',
          negative: 'rgb(var(--accent-red-ink) / <alpha-value>)',
          neutral: 'rgb(var(--color-text-muted) / <alpha-value>)',
          warning: 'rgb(var(--accent-orange-ink) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'display-xl': [
          '4.5rem',
          { lineHeight: '1.1', letterSpacing: '-0.02em' },
        ],
        'display-lg': [
          '3.5rem',
          { lineHeight: '1.1', letterSpacing: '-0.02em' },
        ],
        'display-md': [
          '2.5rem',
          { lineHeight: '1.2', letterSpacing: '-0.01em' },
        ],
        'display-sm': ['1.875rem', { lineHeight: '1.3' }],
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}
