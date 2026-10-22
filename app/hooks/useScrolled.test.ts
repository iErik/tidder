import { act, renderHook } from '@testing-library/react'
import type { UIEvent } from 'react'

import { describe, expect, it } from 'vitest'

import { useScrolled } from './useScrolled'

// happy-dom has no layout, so the scroll offset is set by hand
function scrollEvent(scrollTop: number) {
  const element = document.createElement('div')
  element.scrollTop = scrollTop

  return { currentTarget: element } as unknown as UIEvent<HTMLElement>
}

function render(reset = false) {
  return renderHook(
    (props) => useScrolled(props.reset),
    { initialProps: { reset } }
  )
}

describe('useScrolled', () => {
  it('starts unscrolled', () => {
    const { result } = render()

    expect(result.current.scrolled).toBe(false)
  })

  it('follows the scroll offset down and back up', () => {
    const { result } = render()

    act(() => result.current.onScroll(scrollEvent(120)))
    expect(result.current.scrolled).toBe(true)

    act(() => result.current.onScroll(scrollEvent(0)))
    expect(result.current.scrolled).toBe(false)
  })

  it("doesn't re-render while the state holds", () => {
    let renders = 0
    const { result } = renderHook(() => {
      renders++
      return useScrolled()
    })

    act(() => result.current.onScroll(scrollEvent(10)))
    const afterFlip = renders

    act(() => result.current.onScroll(scrollEvent(20)))
    act(() => result.current.onScroll(scrollEvent(30)))
    expect(renders).toBe(afterFlip)
  })

  it('goes back to unscrolled on reset', () => {
    const { result, rerender } = render()

    act(() => result.current.onScroll(scrollEvent(120)))
    rerender({ reset: true })
    expect(result.current.scrolled).toBe(false)

    rerender({ reset: false })
    expect(result.current.scrolled).toBe(false)
  })
})
