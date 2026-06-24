import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import About from '@/pages/About'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/about']}>
      <About />
    </MemoryRouter>
  )
}

describe('About page', () => {
  it('renders as a dedicated page with the bio and tech stack', () => {
    renderPage()
    // a real page has an h1 (Home owns the site h1 via the Hero)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Built With')).toBeInTheDocument()
    expect(screen.getByText('Pyodide')).toBeInTheDocument()
  })

  it('funnels onward to the work and cross-links the build log (never a dead end)', () => {
    const { container } = renderPage()
    expect(container.querySelector('a[href="/#projects"]')).toBeTruthy()
    expect(container.querySelector('a[href="/build-log"]')).toBeTruthy()
  })
})
