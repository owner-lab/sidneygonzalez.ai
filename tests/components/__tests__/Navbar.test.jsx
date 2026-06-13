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
          <div id="about" />
          <div id="projects" />
          <div id="build-log" />
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

  it('renders the AI Value route link and in-page anchors on Home', () => {
    renderNavbar(['/'])
    expect(screen.getByRole('link', { name: 'AI Value' })).toHaveAttribute('href', '/ai')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '#about')
  })

  it('routes anchors through Home and marks the AI link active when off Home', () => {
    renderNavbar(['/ai'])
    // hrefless route entry must not crash render, and anchors become /#section
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/#about')
    expect(screen.getByRole('link', { name: 'AI Value' })).toHaveAttribute('aria-current', 'page')
  })

  it('re-observes sections after returning to Home (scrollspy survives remount)', () => {
    renderNavbar(['/'], true)
    expect(IntersectionObserver.observeCount).toBeGreaterThanOrEqual(5)

    // leave Home → scrollspy disconnects
    fireEvent.click(screen.getByRole('link', { name: 'AI Value' }))
    expect(IntersectionObserver.disconnectCount).toBeGreaterThanOrEqual(1)
    const afterLeave = IntersectionObserver.observeCount

    // back to Home via the Home anchor (now a route link) → must re-observe
    fireEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(IntersectionObserver.observeCount).toBeGreaterThan(afterLeave)
  })
})
