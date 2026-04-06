import { useState, useEffect, useCallback } from 'react'

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(preference) {
  const isDark =
    preference === 'dark' || (preference === 'system' && getSystemDark())

  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // Update theme-color meta tag
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', isDark ? '#0A0A0F' : '#FFFFFF')
  }

  return isDark
}

export default function useTheme() {
  const [preference, setPreference] = useState(() => {
    if (typeof window === 'undefined') return 'system'
    return localStorage.getItem('theme') || 'system'
  })

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true
    return document.documentElement.classList.contains('dark')
  })

  const setTheme = useCallback((newPref) => {
    setPreference(newPref)
    localStorage.setItem('theme', newPref)
    const dark = applyTheme(newPref)
    setIsDark(dark)
  }, [])

  // Apply on mount and listen for system changes
  useEffect(() => {
    const dark = applyTheme(preference)
    setIsDark(dark)

    if (preference === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        const d = applyTheme('system')
        setIsDark(d)
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [preference])

  return { preference, isDark, setTheme }
}
