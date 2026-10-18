import { act, renderHook } from '@testing-library/react'

import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import type { ContextMenuItem } from 'core/contextMenu'

import { useMenuKeyboard } from './useMenuKeyboard'

const item = (label: string, disabled = false): ContextMenuItem =>
  ({ label, disabled, action: vi.fn() })

// Open in browser, Hide (disabled), Save
const ITEMS = [item('Open'), item('Hide', true), item('Save')]

function renderKeyboard(items = ITEMS) {
  const onChoose = vi.fn()
  const onClose = vi.fn()
  const { result } = renderHook(() =>
    useMenuKeyboard(items, { onChoose, onClose }))

  const active = () => result.current[0]

  // Returns the event, to check whether the page saw it
  function press(key: string, target: EventTarget = document) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true
    })
    act(() => { target.dispatchEvent(event) })
    return event
  }

  return { result, active, press, onChoose, onClose }
}

describe('useMenuKeyboard', () => {
  it('starts with no active item', () => {
    expect(renderKeyboard().active()).toBeNull()
  })

  it('moves down over disabled items and wraps', () => {
    const { active, press } = renderKeyboard()

    press('ArrowDown')
    expect(active()).toBe(0)
    press('ArrowDown')
    expect(active()).toBe(2)
    press('ArrowDown')
    expect(active()).toBe(0)
  })

  it('moves up from the last item', () => {
    const { active, press } = renderKeyboard()

    press('ArrowUp')
    expect(active()).toBe(2)
    press('ArrowUp')
    expect(active()).toBe(0)
  })

  it('has nothing to move to when every item is disabled', () => {
    const { active, press } = renderKeyboard([item('Hide', true)])

    press('ArrowDown')

    expect(active()).toBeNull()
  })

  it('chooses the active item with Enter', () => {
    const { press, onChoose } = renderKeyboard()

    press('ArrowUp')
    press('Enter')

    expect(onChoose).toHaveBeenCalledWith(ITEMS[2])
  })

  it('closes on Enter without an active item', () => {
    const { press, onChoose, onClose } = renderKeyboard()

    const event = press('Enter')

    expect(onChoose).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('does nothing on Enter over a disabled item', () => {
    const { result, press, onChoose, onClose } = renderKeyboard()

    act(() => result.current[1](1))
    const event = press('Enter')

    expect(onChoose).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('closes with Escape', () => {
    const { press, onClose } = renderKeyboard()

    press('Escape')

    expect(onClose).toHaveBeenCalled()
  })

  it('takes its keys from a focused field without moving focus', () => {
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    const onFieldKey = vi.fn()
    input.addEventListener('keydown', onFieldKey)

    try {
      const { active, press } = renderKeyboard()
      const event = press('ArrowDown', input)

      expect(active()).toBe(0)
      expect(event.defaultPrevented).toBe(true)
      expect(onFieldKey).not.toHaveBeenCalled()
      expect(document.activeElement).toBe(input)
    } finally {
      input.remove()
    }
  })

  it('lets the pointer set the active item', () => {
    const { result, active } = renderKeyboard()

    act(() => result.current[1](2))

    expect(active()).toBe(2)
  })
})
