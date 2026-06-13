import { ReactLenis } from 'lenis/react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import RouteScrollManager from '@/components/layout/RouteScrollManager'

// The single cross-route chrome. This component never unmounts as routes
// change, so the one <ReactLenis root> instance (and its smooth-scroll state)
// persists across navigations. Pages render into <Outlet/>.
export default function Layout({ themePreference, onChangeTheme }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      <RouteScrollManager />
      <Navbar themePreference={themePreference} onChangeTheme={onChangeTheme} />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
    </ReactLenis>
  )
}
