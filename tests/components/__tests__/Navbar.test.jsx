import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'

function renderNavbar(initialEntries = ['/'], withSections = false) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {withSections && (
        <>
          <div id="hero" />
          <div id="projects" />
          <div id="contact" />
        </>
      )}
      <Navbar themePreference="system" onChangeTheme={() => {}} />
    </MemoryRouter>
  )
}

describe('Navbar route-awareness', () => {
  beforeEach(() => {
    IntersectionObserver.observeCount = 0
    IntersectionObserver.disconnectCount = 0
  })

  it('renders route links and in-page anchors on Home', () => {
    renderNavbar(['/'])
    // route entries point at their absolute path…
    expect(screen.getByRole('link', { name: 'AI Value' })).toHaveAttribute('href', '/ai')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Build Log' })).toHaveAttribute('href', '/build-log')
    // …while the remaining Home sections stay in-page anchors
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '#projects')
  })

  it('routes anchors through Home and marks the active route off Home', () => {
    renderNavbar(['/ai'])
    // in-page anchors become /#section so they route back to Home then scroll
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/#projects')
    // route entries keep their absolute path regardless of location
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'AI Value' })).toHaveAttribute('aria-current', 'page')
  })

  it('re-observes sections after returning to Home (scrollspy survives remount)', () => {
    renderNavbar(['/'], true)
    expect(IntersectionObserver.observeCount).toBeGreaterThanOrEqual(3)

    // leave Home → scrollspy disconnects
    fireEvent.click(screen.getByRole('link', { name: 'AI Value' }))
    expect(IntersectionObserver.disconnectCount).toBeGreaterThanOrEqual(1)
    const afterLeave = IntersectionObserver.observeCount

    // back to Home via the Home anchor (now a route link) → must re-observe
    fireEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(IntersectionObserver.observeCount).toBeGreaterThan(afterLeave)
  })
})
