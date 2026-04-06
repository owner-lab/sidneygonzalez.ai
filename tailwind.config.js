/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A0F',
          secondary: '#111118',
          surface: '#1E1E2E',
          hover: '#252538',
        },
        accent: {
          blue: '#0068FF',
          green: '#4AF6C3',
          red: '#FF433D',
          orange: '#FB8B1E',
          purple: '#A78BFA',
        },
        text: {
          primary: '#E2E8F0',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.15)',
        },
        impact: {
          positive: '#4AF6C3',
          negative: '#FF433D',
          neutral: '#94A3B8',
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
