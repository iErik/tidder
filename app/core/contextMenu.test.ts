import { act, renderHook } from '@testing-library/react'

import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

// The open menu is kept at module level, so each test gets a
// fresh copy, rendered through useContextMenu()
async function loadContextMenu() {
  vi.resetModules()

  const store = await import('core/contextMenu')
  const { result } = renderHook(() => store.useContextMenu())

  return { ...store, result }
}

const item = (label: string) => ({ label, action: vi.fn() })

describe('contextMenu', () => {
  it('starts closed', async () => {
    const { result } = await loadContextMenu()

    expect(result.current).toBeNull()
  })

  it('opens at the point with the items', async () => {
    const { result, openContextMenu } = await loadContextMenu()
    const items = [item('Save')]

    act(() => openContextMenu(10, 20, items))

    expect(result.current).toMatchObject({ x: 10, y: 20, items })
  })

  it('keeps only the latest menu open', async () => {
    const { result, openContextMenu } = await loadContextMenu()

    act(() => openContextMenu(10, 20, [item('Save')]))
    const first = result.current!.id
    act(() => openContextMenu(30, 40, [item('Hide')]))

    expect(result.current).toMatchObject({ x: 30, y: 40 })
    expect(result.current!.items.map(({ label }) => label))
      .toEqual(['Hide'])
    expect(result.current!.id).not.toBe(first)
  })

  it('opens nothing without items, and closes the open one', async () => {
    const { result, openContextMenu } = await loadContextMenu()

    act(() => openContextMenu(10, 20, [item('Save')]))
    act(() => openContextMenu(30, 40, []))

    expect(result.current).toBeNull()
  })

  it('closes', async () => {
    const {
      result,
      openContextMenu,
      closeContextMenu
    } = await loadContextMenu()

    act(() => openContextMenu(10, 20, [item('Save')]))
    act(() => closeContextMenu())

    expect(result.current).toBeNull()
  })
})
