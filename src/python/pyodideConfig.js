/**
 * Pyodide configuration constants.
 *
 * Consumed by usePyodide.js hook (NOT by the worker — worker is in public/
 * and cannot import from src/).
 *
 * Pyodide version: 0.29.3
 * ⚠️  If upgrading, also update public/pyodide-worker.js CDN URL
 */

export const PYODIDE_VERSION = '0.29.3'

export const WORKER_URL = '/pyodide-worker.js'

export const INIT_TIMEOUT_MS = 30_000 // 30s max before declaring failure

export const MESSAGE_TYPES = {
  // Main → Worker
  INIT: 'init',
  RUN: 'run',
  LOAD_PACKAGES: 'load-packages',
  // Worker → Main
  PROGRESS: 'progress',
  READY: 'ready',
  RESULT: 'result',
  ERROR: 'error',
}
