import { createContext, useContext } from 'react'

/**
 * Lets any descendant of a project open that project's "View Code" slide-out,
 * however deeply it is nested. ProjectLayout owns the CodeToggle state and
 * publishes its opener here; PyodideFallback (rendered several layers down
 * inside ChartContainer) consumes it.
 *
 * This exists because the repo is private — a failed Pyodide worker used to
 * send visitors to GitHub, and the pipeline snippets are now the escape hatch
 * that keeps build principle #5 ("never a blank screen") honest.
 *
 * Defaults to null so consumers rendered outside any project — e.g. the
 * section-level fallback in Projects.jsx — degrade to no CTA instead of
 * crashing. Always null-check before rendering a trigger.
 */
export const ProjectCodeContext = createContext(null)

export function useProjectCode() {
  return useContext(ProjectCodeContext)
}
