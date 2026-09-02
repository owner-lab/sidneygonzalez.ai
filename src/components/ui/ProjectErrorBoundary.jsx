import { Component } from 'react'
import PyodideFallback from './PyodideFallback'

/**
 * Last line of defence for build principle #5 ("Never a blank screen").
 *
 * An uncaught throw inside a project — a partial engine result reaching a
 * formatter, a chart handed a malformed series — unmounts the WHOLE React tree,
 * so one bad number takes the entire site down, not just its own panel. This
 * contains the blast radius to a single project and degrades it to the same
 * static fallback a failed Pyodide worker gets.
 *
 * Must be a class: React has no hook equivalent for componentDidCatch.
 */
export default class ProjectErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Keep the detail in the console — the UI stays executive-facing.
    console.error(
      `Project "${this.props.name ?? 'unknown'}" crashed and was contained:`,
      error,
      info?.componentStack
    )
  }

  render() {
    if (this.state.error) {
      return (
        <PyodideFallback
          error={`${this.props.name ?? 'This module'} could not be rendered.`}
        />
      )
    }
    return this.props.children
  }
}
