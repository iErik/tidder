import { renderHook } from '@testing-library/react'

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { useDismiss } from './useDismiss'

let inside: HTMLElement
let child: HTMLElement
let outside: HTMLElement

function render(enabled = true) {
  const onDismiss = vi.fn()
  const ref = { current: inside }
  const hook = renderHook(
    (props) => useDismiss(ref, onDismiss, props.enabled),
    { initialProps: { enabled } })

  return { onDismiss, ...hook }
}

function mouseDown(target: EventTarget, button = 0) {
  target.dispatchEvent(new MouseEvent(
    'mousedown',
    { bubbles: true, button }
  ))
}

function keyDown(key: string) {
  document.dispatchEvent(new KeyboardEvent(
    'keydown',
    { bubbles: true, key }
  ))
}

describe('useDismiss', () => {
  beforeEach(() => {
    inside = document.createElement('div')
    child = document.createElement('span')
    outside = document.createElement('div')
    inside.append(child)
    document.body.append(inside, outside)
  })

  afterEach(() => {
    document.body.replaceChildren()
  })

  it('dismisses on a mousedown outside the element', () => {
    const { onDismiss } = render()

    mouseDown(outside)
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('dismisses on a mousedown with any button', () => {
    const { onDismiss } = render()

    mouseDown(outside, 2)
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('dismisses even if the target stops propagation', () => {
    const { onDismiss } = render()
    outside.addEventListener(
      'mousedown',
      (event) => event.stopPropagation()
    )

    mouseDown(outside)
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('ignores a mousedown inside the element', () => {
    const { onDismiss } = render()

    mouseDown(inside)
    mouseDown(child)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses on Escape', () => {
    const { onDismiss } = render()

    keyDown('Escape')
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('ignores other keys', () => {
    const { onDismiss } = render()

    keyDown('Enter')
    keyDown('a')
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('adds no listeners while disabled', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const { onDismiss } = render(false)

    mouseDown(outside)
    keyDown('Escape')
    expect(onDismiss).not.toHaveBeenCalled()
    expect(add).not.toHaveBeenCalledWith(
      'mousedown', expect.anything(), true
    )
    add.mockRestore()
  })

  it('stops listening once disabled', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const { onDismiss, rerender } = render()

    rerender({ enabled: false })
    mouseDown(outside)
    keyDown('Escape')
    expect(onDismiss).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith(
      'mousedown', expect.any(Function), true
    )
    expect(remove).toHaveBeenCalledWith(
      'keydown', expect.any(Function)
    )
    remove.mockRestore()
  })

  it('removes its listeners on unmount', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const { onDismiss, unmount } = render()

    unmount()
    mouseDown(outside)
    keyDown('Escape')
    expect(onDismiss).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith(
      'mousedown', expect.any(Function), true
    )
    expect(remove).toHaveBeenCalledWith(
      'keydown', expect.any(Function)
    )
    remove.mockRestore()
  })

  it('calls the latest callback', () => {
    const first = vi.fn()
    const second = vi.fn()
    const ref = { current: inside }
    const { rerender } = renderHook(
      (props) => useDismiss(ref, props.onDismiss, true),
      { initialProps: { onDismiss: first } })

    rerender({ onDismiss: second })
    keyDown('Escape')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
  })
})
