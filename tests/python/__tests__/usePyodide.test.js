import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import usePyodide, { _resetForTesting } from '../../../src/python/usePyodide'

// Mock Worker
class MockWorker {
  constructor(url, options) {
    MockWorker.instances.push(this)
    this.url = url
    this.options = options
    this.postMessage = vi.fn()
    this.terminate = vi.fn()
    this.onmessage = null
    this.onerror = null
  }

  // Simulate a message from the worker
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data })
    }
  }

  simulateError(message) {
    if (this.onerror) {
      this.onerror({ message })
    }
  }
}
MockWorker.instances = []

describe('usePyodide', () => {
  beforeEach(() => {
    _resetForTesting()
    MockWorker.instances = []
    vi.stubGlobal('Worker', MockWorker)
    vi.useFakeTimers()
    // Mock requestIdleCallback to call immediately
    vi.stubGlobal('requestIdleCallback', (cb) => setTimeout(cb, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts in idle state', () => {
    // Don't advance timers — check state before init
    const { result } = renderHook(() => usePyodide())
    expect(result.current.status).toBe('idle')
    expect(result.current.progress).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('creates one Worker and sends init message', () => {
    renderHook(() => usePyodide())
    act(() => vi.advanceTimersByTime(100))

    expect(MockWorker.instances).toHaveLength(1)
    expect(MockWorker.instances[0].url).toBe('/pyodide-worker.js')
    expect(MockWorker.instances[0].options).toEqual({ type: 'module' })
    expect(MockWorker.instances[0].postMessage).toHaveBeenCalledWith({
      type: 'init',
    })
  })

  it('transitions to loading after init', () => {
    const { result } = renderHook(() => usePyodide())
    act(() => vi.advanceTimersByTime(100))
    expect(result.current.status).toBe('loading')
  })

  it('updates progress on progress messages', () => {
    const { result } = renderHook(() => usePyodide())
    act(() => vi.advanceTimersByTime(100))

    act(() => {
      MockWorker.instances[0].simulateMessage({
        type: 'progress',
        percent: 60,
        label: 'Installing pandas...',
      })
    })

    expect(result.current.progress).toBe(60)
    expect(result.current.progressLabel).toBe('Installing pandas...')
  })

  it('transitions to ready on ready message', () => {
    const { result } = renderHook(() => usePyodide())
    act(() => vi.advanceTimersByTime(100))

    act(() => {
      MockWorker.instances[0].simulateMessage({ type: 'ready' })
    })

    expect(result.current.status).toBe('ready')
    expect(result.current.progress).toBe(100)
  })

  it('transitions to error on error message', () => {
    const { result } = renderHook(() => usePyodide())
    act(() => vi.advanceTimersByTime(100))

    act(() => {
      MockWorker.instances[0].simulateMessage({
        type: 'error',
        message: 'Network failed',
      })
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('Network failed')
  })

  it('singleton: two hooks share one Worker', () => {
    renderHook(() => usePyodide())
    renderHook(() => usePyodide())
    act(() => vi.advanceTimersByTime(100))

    expect(MockWorker.instances).toHaveLength(1)
  })

  it('runPython resolves with result', async () => {
    const { result } = renderHook(() => usePyodide())
    act(() => vi.advanceTimersByTime(100))
    act(() => {
      MockWorker.instances[0].simulateMessage({ type: 'ready' })
    })

    let promise
    act(() => {
      promise = result.current.runPython('1 + 1')
    })

    // Get the ID from the postMessage call
    const runCall = MockWorker.instances[0].postMessage.mock.calls.find(
      (c) => c[0].type === 'run'
    )
    const id = runCall[0].id

    act(() => {
      MockWorker.instances[0].simulateMessage({
        type: 'result',
        id,
        data: 2,
      })
    })

    await expect(promise).resolves.toBe(2)
  })

  it('runPython rejects on error', async () => {
    const { result } = renderHook(() => usePyodide())
    act(() => vi.advanceTimersByTime(100))
    act(() => {
      MockWorker.instances[0].simulateMessage({ type: 'ready' })
    })

    let promise
    act(() => {
      promise = result.current.runPython('bad code')
    })

    const runCall = MockWorker.instances[0].postMessage.mock.calls.find(
      (c) => c[0].type === 'run'
    )
    const id = runCall[0].id

    act(() => {
      MockWorker.instances[0].simulateMessage({
        type: 'error',
        id,
        message: 'SyntaxError',
      })
    })

    await expect(promise).rejects.toThrow('SyntaxError')
  })

  it('runPython throws if not ready', () => {
    const { result } = renderHook(() => usePyodide())
    expect(() => result.current.runPython('1+1')).rejects.toThrow(
      'Pyodide not ready'
    )
  })

  it('times out after INIT_TIMEOUT_MS', () => {
    const { result } = renderHook(() => usePyodide())
    act(() => vi.advanceTimersByTime(100)) // trigger init

    // Fast-forward past timeout (30s)
    act(() => vi.advanceTimersByTime(30_000))

    expect(result.current.status).toBe('error')
    expect(result.current.error).toContain('timed out')
  })

  it('worker crash rejects all pending promises', async () => {
    const { result } = renderHook(() => usePyodide())
    act(() => vi.advanceTimersByTime(100))
    act(() => {
      MockWorker.instances[0].simulateMessage({ type: 'ready' })
    })

    let promise1, promise2
    act(() => {
      promise1 = result.current.runPython('code1')
      promise2 = result.current.runPython('code2')
    })

    // Simulate worker crash
    act(() => {
      MockWorker.instances[0].simulateError('Out of memory')
    })

    await expect(promise1).rejects.toThrow('Out of memory')
    await expect(promise2).rejects.toThrow('Out of memory')
    expect(result.current.status).toBe('error')
  })
})
