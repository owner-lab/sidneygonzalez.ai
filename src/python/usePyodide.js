/**
 * React hook for Pyodide Web Worker lifecycle.
 *
 * Uses a module-level singleton so all components share one worker.
 * Compatible with React 18 StrictMode (no-op on double mount).
 * Uses useSyncExternalStore for reactive state binding.
 */

import { useSyncExternalStore, useCallback } from 'react'
import { WORKER_URL, INIT_TIMEOUT_MS, MESSAGE_TYPES } from './pyodideConfig'

// ─── Module-level singleton state ───────────────────────────────

let worker = null
let initScheduled = false
let state = Object.freeze({
  status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
  progress: 0,
  progressLabel: '',
  error: null,
})

const listeners = new Set()
const pending = new Map() // id -> { resolve, reject }

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

function setState(updates) {
  state = Object.freeze({ ...state, ...updates })
  notify()
}

// ─── Worker lifecycle ───────────────────────────────────────────

function initWorker() {
  if (worker) return // no-op on second call (StrictMode safe)

  // Skip on low-memory devices
  if (typeof navigator !== 'undefined' && navigator.deviceMemory && navigator.deviceMemory < 2) {
    setState({ status: 'error', error: 'Live demo requires 2GB+ RAM' })
    return
  }

  try {
    worker = new Worker(WORKER_URL, { type: 'module' })
  } catch {
    setState({
      status: 'error',
      error: 'Browser does not support module workers',
    })
    return
  }

  setState({ status: 'loading', progress: 0, progressLabel: 'Starting...' })

  worker.postMessage({ type: MESSAGE_TYPES.INIT })

  worker.onmessage = ({ data: msg }) => {
    switch (msg.type) {
      case MESSAGE_TYPES.PROGRESS:
        setState({
          progress: msg.percent,
          progressLabel: msg.label || '',
        })
        break

      case MESSAGE_TYPES.READY:
        setState({
          status: 'ready',
          progress: 100,
          progressLabel: 'Python Live',
        })
        break

      case MESSAGE_TYPES.RESULT:
        if (msg.id && pending.has(msg.id)) {
          pending.get(msg.id).resolve(msg.data)
          pending.delete(msg.id)
        }
        break

      case MESSAGE_TYPES.ERROR:
        if (msg.id && pending.has(msg.id)) {
          // Per-request error
          pending.get(msg.id).reject(new Error(msg.message))
          pending.delete(msg.id)
        } else {
          // Global error (init failure, etc.)
          setState({
            status: 'error',
            error: msg.message || 'Python runtime error',
          })
        }
        break
    }
  }

  worker.onerror = (e) => {
    // Reject ALL pending promises so callers don't hang
    for (const [_id, { reject }] of pending) {
      reject(new Error(e.message || 'Worker crashed'))
    }
    pending.clear()
    setState({
      status: 'error',
      error: e.message || 'Python runtime crashed',
    })
  }

  // Timeout: if no ready message in INIT_TIMEOUT_MS, declare failure
  setTimeout(() => {
    if (state.status === 'loading') {
      setState({
        status: 'error',
        error: 'Python runtime timed out. Live demo unavailable.',
      })
    }
  }, INIT_TIMEOUT_MS)
}

function scheduleInit() {
  if (initScheduled) return
  initScheduled = true

  // Defer init so hero paint completes first (~3.5s)
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => initWorker(), { timeout: 5000 })
  } else {
    setTimeout(initWorker, 3500)
  }
}

// ─── External store API for useSyncExternalStore ────────────────

function subscribe(listener) {
  listeners.add(listener)

  // Schedule init on first subscription (deferred)
  scheduleInit()

  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

// SSR fallback — always idle on server
function getServerSnapshot() {
  return Object.freeze({
    status: 'idle',
    progress: 0,
    progressLabel: '',
    error: null,
  })
}

// ─── Hook ───────────────────────────────────────────────────────

export default function usePyodide() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const runPython = useCallback(
    async (python, context = {}) => {
      if (state.status !== 'ready') {
        throw new Error('Pyodide not ready')
      }

      const id = crypto.randomUUID()

      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        worker.postMessage({
          type: MESSAGE_TYPES.RUN,
          id,
          python,
          context,
        })
      })
    },
    [] // stable reference — state.status checked at call time, not render time
  )

  const loadPackages = useCallback(
    async (packages) => {
      if (state.status !== 'ready') {
        throw new Error('Pyodide not ready')
      }
      worker.postMessage({
        type: MESSAGE_TYPES.LOAD_PACKAGES,
        packages,
      })
    },
    []
  )

  return {
    status: snapshot.status,
    progress: snapshot.progress,
    progressLabel: snapshot.progressLabel,
    error: snapshot.error,
    runPython,
    loadPackages,
  }
}

// ─── Test helpers (not exported in production) ──────────────────

export function _resetForTesting() {
  if (worker) {
    worker.terminate()
    worker = null
  }
  initScheduled = false
  state = Object.freeze({
    status: 'idle',
    progress: 0,
    progressLabel: '',
    error: null,
  })
  listeners.clear()
  pending.clear()
}
