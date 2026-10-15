import {
  act,
  renderHook
} from '@testing-library/react'

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { useDebouncedValue } from './useDebouncedValue'

function render(value: string, delay = 300) {
  return renderHook(
    (props) => useDebouncedValue(props.value, props.delay),
    { initialProps: { value, delay } })
}

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with the value', () => {
    expect(render('a').result.current).toBe('a')
  })

  it('follows the value once it stops changing', () => {
    const { result, rerender } = render('a')

    rerender({ value: 'b', delay: 300 })
    act(() => { vi.advanceTimersByTime(299) })
    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe('b')
  })

  it('waits again after each change', () => {
    const { result, rerender } = render('a')

    rerender({ value: 'b', delay: 300 })
    act(() => { vi.advanceTimersByTime(200) })
    rerender({ value: 'c', delay: 300 })
    act(() => { vi.advanceTimersByTime(200) })
    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe('c')
  })

  it('uses the current delay', () => {
    const { result, rerender } = render('a')

    rerender({ value: 'b', delay: 1000 })
    act(() => { vi.advanceTimersByTime(999) })
    expect(result.current).toBe('a')

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe('b')
  })
})
