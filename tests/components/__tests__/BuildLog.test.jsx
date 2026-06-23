import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BuildLog from '@/pages/BuildLog'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/build-log']}>
      <BuildLog />
    </MemoryRouter>
  )
}

describe('BuildLog page', () => {
  it('renders as a dedicated page with the decision timeline', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Why Pyodide Instead of a Backend')).toBeInTheDocument()
    expect(screen.getByText('Why Smooth Scroll Requires a Contract')).toBeInTheDocument()
  })

  it('funnels onward to the work and the conversation (never a dead end)', () => {
    const { container } = renderPage()
    expect(container.querySelector('a[href="/#projects"]')).toBeTruthy()
    expect(container.querySelector('a[href="/#contact"]')).toBeTruthy()
  })
})
