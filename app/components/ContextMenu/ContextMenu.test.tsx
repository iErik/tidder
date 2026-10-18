import {
  act,
  cleanup,
  fireEvent,
  render,
  screen
} from '@testing-library/react'

import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { tidder } from '../../test/fakeTidder'

// The component and the store share the open menu at module
// level, so each test loads fresh copies of both
async function renderMenu() {
  vi.resetModules()

  const store = await import('core/contextMenu')
  const { default: ContextMenu } =
    await import('components/ContextMenu/ContextMenu')

  render(<ContextMenu />)

  return store
}

const menu = () => screen.queryByRole('menu')
const labels = () =>
  screen.queryAllByRole('menuitem').map((item) => item.textContent)

function rightClick(target: Element = document.body) {
  return fireEvent.contextMenu(target, { clientX: 10, clientY: 20 })
}

// An element in the page for the test, removed afterwards
const added: Element[] = []

function appended<T extends Element>(element: T): T {
  added.push(element)
  return document.body.appendChild(element)
}

afterEach(() => {
  cleanup()
  added.splice(0).forEach((element) => element.remove())
})

describe('ContextMenu', () => {
  it('opens nothing outside dev mode, without the native menu', async () => {
    await renderMenu()

    const shown = rightClick()

    expect(menu()).toBeNull()
    // fireEvent returns false once preventDefault was called
    expect(shown).toBe(false)
  })

  it('opens Inspect anywhere in dev mode', async () => {
    tidder().isDev = true
    await renderMenu()

    rightClick()

    expect(labels()).toEqual(['Inspect'])
  })

  it('keeps the menu a component opened', async () => {
    tidder().isDev = true
    const { openContextMenu } = await renderMenu()
    const target = appended(document.createElement('div'))
    target.addEventListener('contextmenu', () => {
      openContextMenu(10, 20, [{ label: 'Save', action: vi.fn() }])
    })

    act(() => { rightClick(target) })

    expect(labels()).toEqual(['Save'])
  })

  it('stops the native menu even if a component stops the event',
    async () => {
      await renderMenu()
      const target = appended(document.createElement('div'))
      target.addEventListener('contextmenu', (e) => e.stopPropagation())

      expect(rightClick(target)).toBe(false)
    })

  it('keeps the focus and selection on a right mousedown', async () => {
    await renderMenu()
    const input = appended(document.createElement('input'))

    const right = fireEvent.mouseDown(input, { button: 2 })
    const left = fireEvent.mouseDown(input, { button: 0 })

    // fireEvent returns false once preventDefault was called
    expect(right).toBe(false)
    expect(left).toBe(true)
  })

  it('opens nothing over itself on a right-click', async () => {
    tidder().isDev = true
    const { openContextMenu } = await renderMenu()

    act(() => openContextMenu(10, 20, [
      { label: 'Save', action: vi.fn() }
    ]))
    rightClick(screen.getByText('Save'))

    expect(labels()).toEqual(['Save'])
  })

  it('opens Inspect for a right-click inside an embed', async () => {
    tidder().isDev = true
    await renderMenu()
    const [listener] = tidder().contextMenu.onForwarded.mock.calls[0]

    act(() => listener(forwarded({ isSubframe: true })))

    expect(labels()).toEqual(['Inspect'])
  })

  it('shows the items, disabled ones as such', async () => {
    const { openContextMenu } = await renderMenu()

    act(() => openContextMenu(10, 20, [
      { label: 'Save', action: vi.fn() },
      { label: 'Report', disabled: true, action: vi.fn() }
    ]))

    expect(labels()).toEqual(['Save', 'Report'])
    expect(screen.getByText('Report').getAttribute('aria-disabled'))
      .toBe('true')
  })

  it('closes and runs the item that was chosen', async () => {
    const { openContextMenu } = await renderMenu()
    const action = vi.fn()

    act(() => openContextMenu(10, 20, [{ label: 'Save', action }]))
    fireEvent.click(screen.getByText('Save'))

    expect(action).toHaveBeenCalled()
    expect(menu()).toBeNull()
  })

  it('does nothing when a disabled item is clicked', async () => {
    const { openContextMenu } = await renderMenu()
    const action = vi.fn()

    act(() => openContextMenu(10, 20, [
      { label: 'Report', disabled: true, action }
    ]))
    fireEvent.click(screen.getByText('Report'))

    expect(action).not.toHaveBeenCalled()
    expect(menu()).not.toBeNull()
  })

  it('marks the item the keyboard moved to as active', async () => {
    const { openContextMenu } = await renderMenu()

    act(() => openContextMenu(10, 20, [
      { label: 'Save', action: vi.fn() }
    ]))
    fireEvent.keyDown(document, { key: 'ArrowDown' })

    const active = menu()!.getAttribute('aria-activedescendant')
    expect(active).toBe(screen.getByText('Save').id)
  })

  it.each([
    ['a click outside it', () => fireEvent.mouseDown(document.body)],
    ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
    ['scrolling', () => fireEvent.scroll(window)],
    ['a resize', () => fireEvent(window, new Event('resize'))],
    ['the window losing focus', () => fireEvent.blur(window)]
  ])('closes on %s', async (_, trigger) => {
    const { openContextMenu } = await renderMenu()

    act(() => openContextMenu(10, 20, [
      { label: 'Save', action: vi.fn() }
    ]))
    trigger()

    expect(menu()).toBeNull()
  })

  it('stays open on a click inside it', async () => {
    const { openContextMenu } = await renderMenu()

    act(() => openContextMenu(10, 20, [
      { label: 'Save', action: vi.fn() }
    ]))
    fireEvent.mouseDown(screen.getByText('Save'))

    expect(menu()).not.toBeNull()
  })
})

function forwarded(
  params: Partial<TidderContextMenuParams>
): TidderContextMenuParams {
  return {
    x: 10,
    y: 20,
    isSubframe: false,
    selectionText: '',
    linkURL: '',
    srcURL: '',
    mediaType: 'none',
    isEditable: false,
    editFlags: {
      canUndo: false,
      canRedo: false,
      canCut: false,
      canCopy: false,
      canPaste: false,
      canDelete: false,
      canSelectAll: false,
      canEditRichly: false
    },
    ...params
  }
}
