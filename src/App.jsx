import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import About from '@/pages/About'
import BuildLog from '@/pages/BuildLog'
import useTheme from '@/hooks/useTheme'

// The AI Value Test is the only route-level lazy chunk — the router itself is
// eager by construction (imported at module top), so only the page payload
// (manifesto + ported ROI model) is deferred. About and Build Log are static
// content with no heavy deps, so they ride the main chunk (no Suspense needed).
const AiValueTest = lazy(() => import('@/pages/AiValueTest'))

export default function App() {
  const { preference, setTheme } = useTheme()

  return (
    <Routes>
      <Route
        element={<Layout themePreference={preference} onChangeTheme={setTheme} />}
      >
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/build-log" element={<BuildLog />} />
        <Route
          path="/ai"
          element={
            <Suspense fallback={null}>
              <AiValueTest />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
