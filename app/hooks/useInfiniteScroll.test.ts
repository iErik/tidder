import { renderHook } from '@testing-library/react'

import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { useInfiniteScroll } from './useInfiniteScroll'

// happy-dom has no IntersectionObserver. The renderer project
// unstubs it after each test
class FakeObserver {
  static instances: FakeObserver[] = []

  observed: Element[] = []
  disconnected = false

  constructor(
    public callback: IntersectionObserverCallback,
    public options: IntersectionObserverInit
  ) {
    FakeObserver.instances.push(this)
  }

  observe(element: Element) {
    this.observed.push(element)
  }

  disconnect() {
    this.disconnected = true
  }

  // What the browser does when the sentinel moves in or out
  intersect(isIntersecting: boolean) {
    const entry = { isIntersecting } as IntersectionObserverEntry
    this.callback([entry], this as unknown as IntersectionObserver)
  }
}

const container = { current: document.createElement('div') }
const sentinel = { current: document.createElement('div') }

function render(
  onEnd: () => void,
  options: { disabled?: boolean; margin?: number } = { }
) {
  return renderHook(
    (props) => useInfiniteScroll(
      container, sentinel, props.onEnd, props.options),
    { initialProps: { onEnd, options } })
}

function observers() {
  return FakeObserver.instances
}

beforeEach(() => {
  FakeObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeObserver)
})

describe('useInfiniteScroll', () => {
  it('watches the sentinel within the container', () => {
    render(vi.fn())

    expect(observers()).toHaveLength(1)
    expect(observers()[0].observed).toEqual([sentinel.current])
    expect(observers()[0].options).toEqual({
      root: container.current,
      rootMargin: '0px 0px 600px 0px'
    })
  })

  it('calls onEnd when the sentinel comes into view', () => {
    const onEnd = vi.fn()
    render(onEnd)

    observers()[0].intersect(false)
    expect(onEnd).not.toHaveBeenCalled()

    observers()[0].intersect(true)
    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('calls the latest onEnd without a new observer', () => {
    const first = vi.fn()
    const latest = vi.fn()
    const { rerender } = render(first)

    rerender({ onEnd: latest, options: { } })
    observers()[0].intersect(true)

    expect(observers()).toHaveLength(1)
    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledOnce()
  })

  it('uses the given margin', () => {
    render(vi.fn(), { margin: 100 })

    expect(observers()[0].options.rootMargin)
      .toBe('0px 0px 100px 0px')
  })

  it("doesn't watch while disabled", () => {
    const { rerender } = render(vi.fn(), { disabled: true })
    expect(observers()).toHaveLength(0)

    rerender({ onEnd: vi.fn(), options: { disabled: false } })
    expect(observers()).toHaveLength(1)
  })

  it("doesn't watch without the elements", () => {
    renderHook(() => useInfiniteScroll(
      { current: null }, sentinel, vi.fn()))

    expect(observers()).toHaveLength(0)
  })

  it('stops watching when disabled or unmounted', () => {
    const { rerender, unmount } = render(vi.fn())

    rerender({ onEnd: vi.fn(), options: { disabled: true } })
    expect(observers()[0].disconnected).toBe(true)

    rerender({ onEnd: vi.fn(), options: { disabled: false } })
    unmount()
    expect(observers()[1].disconnected).toBe(true)
  })
})
