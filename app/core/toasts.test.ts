import { act, renderHook } from '@testing-library/react'

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

const SECOND = 1000

// toasts keeps its Toasts, timers and config at module level,
// so each test gets a fresh copy, rendered through useToasts()
async function loadToasts() {
  vi.resetModules()

  const toasts = await import('core/toasts')
  const { result } = renderHook(() => toasts.useToasts())

  // Fires a Toast, or anything else that updates the store,
  // inside act()
  function run<T>(fn: () => T): T {
    let value: T | undefined
    act(() => { value = fn() })
    return value as T
  }

  function advance(ms: number) {
    act(() => { vi.advanceTimersByTime(ms) })
  }

  const ids = () => result.current.map((item) => item.id)

  return { ...toasts, result, run, advance, ids }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('toast', () => {
  it('adds a Toast with the type and message given', async () => {
    const { toast, run, result } = await loadToasts()

    const id = run(() => toast({ type: 'warning', message: 'Hmm' }))

    expect(result.current).toEqual([{
      id,
      type: 'warning',
      message: 'Hmm',
      icon: 'information',
      closing: false
    }])
  })

  it('requires a type and a message', async () => {
    const { toast, run } = await loadToasts()

    run(() => {
      // @ts-expect-error: no type
      toast({ message: 'Hmm' })
      // @ts-expect-error: no message
      toast({ type: 'error' })
      // @ts-expect-error: no message
      toast.error()
    })
  })

  it('has a helper per type', async () => {
    const { toast, run, result } = await loadToasts()

    run(() => {
      toast.error('Failed')
      toast.warning('Careful', { duration: 0 })
      toast.success('Done', { icon: 'check' })
    })

    expect(result.current.map(({ type, message, icon }) =>
      ({ type, message, icon }))).toEqual([
      { type: 'error', message: 'Failed', icon: 'information' },
      { type: 'warning', message: 'Careful', icon: 'information' },
      { type: 'success', message: 'Done', icon: 'check' }
    ])
  })

  it('gives every Toast a new id, without merging them', async () => {
    const { toast, run, result } = await loadToasts()

    const first = run(() => toast.error('Failed'))
    const second = run(() => toast.error('Failed'))

    expect(first).not.toBe(second)
    expect(result.current).toHaveLength(2)
  })
})

describe('closing on its own', () => {
  it('closes after 10s by default', async () => {
    const { toast, run, advance, result, ids } = await loadToasts()

    run(() => toast.success('Done'))

    advance(10 * SECOND - 1)
    expect(result.current[0].closing).toBe(false)

    advance(1)
    expect(result.current[0].closing).toBe(true)

    // Removed once it has faded out
    advance(300)
    expect(ids()).toEqual([])
  })

  it('closes after a custom duration', async () => {
    const { toast, run, advance, result } = await loadToasts()

    run(() => toast.success('Done', { duration: 2 * SECOND }))

    advance(2 * SECOND - 1)
    expect(result.current[0].closing).toBe(false)

    advance(1)
    expect(result.current[0].closing).toBe(true)
  })

  it('uses the configured default duration', async () => {
    const {
      configureToasts,
      toast,
      run,
      advance,
      result
    } = await loadToasts()

    configureToasts({ duration: 3 * SECOND })
    run(() => toast.success('Done'))

    advance(3 * SECOND)
    expect(result.current[0].closing).toBe(true)
  })

  it.each([0, null])('stays open with a duration of %s',
    async (duration) => {
      const { toast, run, advance, result } = await loadToasts()

      run(() => toast.error('Failed', { duration }))

      advance(60 * 60 * SECOND)
      expect(result.current).toHaveLength(1)
      expect(result.current[0].closing).toBe(false)
    })
})

describe('dismissToast', () => {
  it('fades the Toast out, then removes it', async () => {
    const {
      dismissToast,
      toast,
      run,
      advance,
      result,
      ids
    } = await loadToasts()

    const id = run(() => toast.error('Failed', { duration: null }))
    run(() => dismissToast(id))

    expect(result.current[0].closing).toBe(true)

    advance(299)
    expect(ids()).toEqual([id])

    advance(1)
    expect(ids()).toEqual([])
  })

  it('leaves the other Toasts alone', async () => {
    const { dismissToast, toast, run, advance, ids } =
      await loadToasts()

    const first = run(() => toast.error('Failed'))
    const second = run(() => toast.success('Done'))

    run(() => dismissToast(first))
    advance(300)

    expect(ids()).toEqual([second])
  })

  it('ignores an unknown or already closing Toast', async () => {
    const { dismissToast, toast, run, advance, ids } =
      await loadToasts()

    const id = run(() => toast.error('Failed'))

    run(() => {
      dismissToast(id + 1)
      dismissToast(id)
      dismissToast(id)
    })
    advance(300)

    expect(ids()).toEqual([])
  })
})

describe('pausing', () => {
  it('resumes with the time that was left', async () => {
    const {
      pauseToast,
      resumeToast,
      toast,
      run,
      advance,
      result
    } = await loadToasts()

    const id = run(() => toast.success('Done'))

    advance(4 * SECOND)
    pauseToast(id)

    advance(60 * SECOND)
    expect(result.current[0].closing).toBe(false)

    resumeToast(id)

    advance(6 * SECOND - 1)
    expect(result.current[0].closing).toBe(false)

    advance(1)
    expect(result.current[0].closing).toBe(true)
  })

  it('pauses only that Toast', async () => {
    const { pauseToast, toast, run, advance, result } =
      await loadToasts()

    const paused = run(() => toast.success('Paused'))
    run(() => toast.success('Running'))

    pauseToast(paused)
    advance(10 * SECOND)

    expect(result.current.map((item) => item.closing))
      .toEqual([false, true])
  })

  it('ignores a second pause or resume', async () => {
    const {
      pauseToast,
      resumeToast,
      toast,
      run,
      advance,
      result
    } = await loadToasts()

    const id = run(() => toast.success('Done'))

    advance(4 * SECOND)
    pauseToast(id)
    advance(SECOND)
    pauseToast(id)

    resumeToast(id)
    advance(SECOND)
    resumeToast(id)

    advance(5 * SECOND - 1)
    expect(result.current[0].closing).toBe(false)

    advance(1)
    expect(result.current[0].closing).toBe(true)
  })

  it('does nothing to a Toast that stays open', async () => {
    const {
      pauseToast,
      resumeToast,
      toast,
      run,
      advance,
      result
    } = await loadToasts()

    const id = run(() => toast.error('Failed', { duration: 0 }))

    pauseToast(id)
    resumeToast(id)
    advance(60 * SECOND)

    expect(result.current[0].closing).toBe(false)
  })
})

describe('the limit of 5 Toasts', () => {
  it('closes the oldest when a sixth arrives', async () => {
    const { toast, run, advance, result, ids } = await loadToasts()

    const [oldest, ...rest] = run(() =>
      [1, 2, 3, 4, 5].map((n) => toast.success(`Toast ${n}`)))
    const sixth = run(() => toast.success('Toast 6'))

    expect(result.current.find((item) => item.id === oldest)
      ?.closing).toBe(true)

    advance(300)
    expect(ids()).toEqual([...rest, sixth])
  })

  it('never has more than 5 open', async () => {
    const { toast, run, result } = await loadToasts()

    run(() => {
      for (let n = 0; n < 12; n++) toast.error(`Toast ${n}`)
    })

    const open = result.current.filter((item) => !item.closing)
    expect(open.map((item) => item.message)).toEqual([
      'Toast 7', 'Toast 8', 'Toast 9', 'Toast 10', 'Toast 11'
    ])
  })
})

describe('icons', () => {
  it('uses the call\'s icon, then the configured one, then the '
    + 'built-in one', async () => {
    const { configureToasts, toast, run, result } = await loadToasts()

    configureToasts({ icons: { error: 'nsfw' } })

    run(() => {
      toast.error('Call', { icon: 'spoiler' })
      toast.error('Configured')
      toast.warning('Built-in')
      toast.success('Built-in')
    })

    expect(result.current.map((item) => item.icon))
      .toEqual(['spoiler', 'nsfw', 'information', 'verify'])
  })

  it('keeps earlier configured icons', async () => {
    const { configureToasts, toast, run, result } = await loadToasts()

    configureToasts({ icons: { error: 'nsfw' } })
    configureToasts({ icons: { success: 'check' } })

    run(() => {
      toast.error('Failed')
      toast.success('Done')
    })

    expect(result.current.map((item) => item.icon))
      .toEqual(['nsfw', 'check'])
  })
})

describe('configureToasts', () => {
  it('puts the newest Toast at the bottom by default', async () => {
    const { getToastConfig } = await loadToasts()

    expect(getToastConfig().newestOnTop).toBe(false)
  })

  it('sets newestOnTop, keeping the other options', async () => {
    const { configureToasts, getToastConfig } = await loadToasts()

    configureToasts({ duration: 5 * SECOND })
    configureToasts({ newestOnTop: true })

    expect(getToastConfig()).toEqual({
      duration: 5 * SECOND,
      newestOnTop: true,
      icons: { }
    })
  })
})
