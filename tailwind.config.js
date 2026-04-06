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
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          medium: 'var(--color-border-medium)',
        },
        impact: {
          positive: '#4AF6C3',
          negative: '#FF433D',
          neutral: 'rgb(var(--color-text-muted) / <alpha-value>)',
          warning: '#FB8B1E',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
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
