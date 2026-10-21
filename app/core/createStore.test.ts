import { act, renderHook } from '@testing-library/react'

import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { createStore } from 'core/createStore'

describe('createStore', () => {
  it('starts with the initial value', () => {
    const store = createStore(1)

    expect(store.get()).toBe(1)
  })

  it('replaces the value', () => {
    const store = createStore(1)

    store.set(2)

    expect(store.get()).toBe(2)
  })

  it('passes the current value to an updater', () => {
    const store = createStore({ a: 1, b: 2 })

    store.set((prev) => ({ ...prev, b: 3 }))

    expect(store.get()).toEqual({ a: 1, b: 3 })
  })

  it('notifies subscribers on every set', () => {
    const store = createStore(1)
    const listener = vi.fn()
    store.subscribe(listener)

    store.set(2)
    store.set(2)

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('stops notifying a listener once it unsubscribes', () => {
    const store = createStore(1)
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    unsubscribe()
    store.set(2)

    expect(listener).not.toHaveBeenCalled()
  })

  it('re-renders the hook when the value changes', () => {
    const store = createStore('a')
    const { result } = renderHook(() => store.useStore())

    act(() => store.set('b'))

    expect(result.current).toBe('b')
  })

  describe('with a selector', () => {
    const initial = { a: { n: 1 }, b: { n: 1 } }

    it('returns the selected part', () => {
      const store = createStore(initial)
      const { result } = renderHook(
        () => store.useStore((state) => state.a)
      )

      act(() => store.set((prev) => ({ ...prev, a: { n: 2 } })))

      expect(result.current).toEqual({ n: 2 })
    })

    it('skips re-rendering for an unrelated change', () => {
      const store = createStore(initial)
      let renders = 0
      renderHook(() => {
        renders++
        return store.useStore((state) => state.a)
      })
      const before = renders

      act(() => store.set((prev) => ({ ...prev, b: { n: 2 } })))

      expect(renders).toBe(before)
    })
  })
})
