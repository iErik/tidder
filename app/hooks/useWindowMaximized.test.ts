import {
  act,
  renderHook,
  waitFor
} from '@testing-library/react'

import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  changeMaximized,
  tidder
} from '../test/fakeTidder'
import { useWindowMaximized } from './useWindowMaximized'

// Holds back the main process's answer until the test sends
// it with the function returned
function holdAnswer() {
  let answer: (maximized: boolean) => void = () => { }
  const answered = new Promise<boolean>((resolve) => {
    answer = resolve
  })

  tidder().window.isMaximized.mockReturnValue(answered)

  return answer
}

describe('useWindowMaximized', () => {
  it('starts from the main process\'s answer', async () => {
    tidder().window.isMaximized.mockResolvedValue(true)

    const { result } = renderHook(() => useWindowMaximized())

    await waitFor(() => expect(result.current).toBe(true))
  })

  it('is false until the main process answers', () => {
    holdAnswer()

    const { result } = renderHook(() => useWindowMaximized())

    expect(result.current).toBe(false)
  })

  it('follows every change from the main process', async () => {
    const { result } = renderHook(() => useWindowMaximized())
    await act(() => Promise.resolve())

    act(() => changeMaximized(true))
    expect(result.current).toBe(true)

    act(() => changeMaximized(false))
    expect(result.current).toBe(false)
  })

  it('keeps a change that arrives before the answer', async () => {
    const answer = holdAnswer()
    const { result } = renderHook(() => useWindowMaximized())

    act(() => changeMaximized(true))
    answer(false)
    await act(() => Promise.resolve())

    expect(result.current).toBe(true)
  })

  it('stops listening on unmount', () => {
    const dispose = vi.fn()
    tidder().window.onMaximizedChange.mockReturnValue({ dispose })
    const { unmount } = renderHook(() => useWindowMaximized())

    expect(dispose).not.toHaveBeenCalled()
    unmount()

    expect(dispose).toHaveBeenCalledOnce()
  })
})
