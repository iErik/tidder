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

  it('replays a right-click inside an embed on the iframe', async () => {
    const { openContextMenu } = await renderMenu()
    const iframe = appended(document.createElement('iframe'))
    const points: number[][] = []
    iframe.addEventListener('contextmenu', (e) => {
      points.push([e.clientX, e.clientY])
      openContextMenu(e.clientX, e.clientY, [
        { label: 'Copy URL', action: vi.fn() }
      ])
    })
    const fromPoint = vi.spyOn(document, 'elementFromPoint')
      .mockReturnValue(iframe)
    const [listener] = tidder().contextMenu.onForwarded.mock.calls[0]

    act(() => listener(forwarded({ isSubframe: true })))

    expect(fromPoint).toHaveBeenCalledWith(10, 20)
    expect(points).toEqual([[10, 20]])
    expect(labels()).toEqual(['Copy URL'])
  })

  it('ignores forwarded right-clicks outside iframes', async () => {
    tidder().isDev = true
    await renderMenu()
    const [listener] = tidder().contextMenu.onForwarded.mock.calls[0]

    act(() => listener(forwarded({ isSubframe: false })))

    expect(menu()).toBeNull()
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

  it('gives each item an id of its own, none active at first',
    async () => {
      const { openContextMenu } = await renderMenu()

      act(() => openContextMenu(10, 20, [
        { label: 'Save', action: vi.fn() },
        { label: 'Hide', action: vi.fn() }
      ]))

      const ids = screen.getAllByRole('menuitem').map((item) => item.id)
      expect(ids.every(Boolean)).toBe(true)
      expect(new Set(ids).size).toBe(2)
      expect(menu()!.hasAttribute('aria-activedescendant')).toBe(false)
    })

  it('marks the item under the pointer as active, if enabled',
    async () => {
      const { openContextMenu } = await renderMenu()

      act(() => openContextMenu(10, 20, [
        { label: 'Save', action: vi.fn() },
        { label: 'Report', disabled: true, action: vi.fn() }
      ]))
      const active = () => menu()!.getAttribute('aria-activedescendant')

      fireEvent.mouseEnter(screen.getByText('Save'))
      expect(active()).toBe(screen.getByText('Save').id)
      fireEvent.mouseLeave(screen.getByText('Save'))
      expect(active()).toBeNull()
      fireEvent.mouseEnter(screen.getByText('Report'))
      expect(active()).toBeNull()
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

// A focused text field with "me te" selected
function focusedField() {
  const input = appended(document.createElement('input'))
  input.value = 'some text'
  input.focus()
  input.setSelectionRange(2, 7)
  return input
}

function expectUntouched(input: HTMLInputElement) {
  expect(document.activeElement).toBe(input)
  expect([input.selectionStart, input.selectionEnd]).toEqual([2, 7])
}

describe('ContextMenu focus', () => {
  it('keeps the field\'s focus and selection through a right-click',
    async () => {
      tidder().isDev = true
      await renderMenu()
      const input = focusedField()

      act(() => {
        fireEvent.mouseDown(input, { button: 2 })
        rightClick(input)
      })

      expect(labels()).toEqual(['Inspect'])
      expectUntouched(input)
    })

  it('can\'t be focused itself', async () => {
    const { openContextMenu } = await renderMenu()

    act(() => openContextMenu(10, 20, [
      { label: 'Save', action: vi.fn() }
    ]))

    expect(menu()!.hasAttribute('tabindex')).toBe(false)
    expect(screen.getByText('Save').hasAttribute('tabindex'))
      .toBe(false)
  })

  it('keeps the field\'s focus and selection on a click',
    async () => {
      const { openContextMenu } = await renderMenu()
      const input = focusedField()
      const action = vi.fn()

      act(() => openContextMenu(10, 20, [{ label: 'Save', action }]))
      const save = screen.getByText('Save')
      fireEvent.mouseEnter(save)
      // fireEvent returns false once preventDefault was called
      expect(fireEvent.mouseDown(save)).toBe(false)
      fireEvent.click(save)

      expect(action).toHaveBeenCalled()
      expect(menu()).toBeNull()
      expectUntouched(input)
    })

  it('chooses with the arrows and Enter, out of the field\'s reach',
    async () => {
      const { openContextMenu } = await renderMenu()
      const input = focusedField()
      const onFieldKey = vi.fn()
      input.addEventListener('keydown', onFieldKey)
      const save = vi.fn()
      const hide = vi.fn()

      act(() => openContextMenu(10, 20, [
        { label: 'Save', action: save },
        { label: 'Hide', action: hide }
      ]))
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'ArrowDown' })

      expect(menu()!.getAttribute('aria-activedescendant'))
        .toBe(screen.getByText('Hide').id)
      expectUntouched(input)

      fireEvent.keyDown(input, { key: 'Enter' })

      expect(hide).toHaveBeenCalled()
      expect(save).not.toHaveBeenCalled()
      expect(menu()).toBeNull()
      expect(onFieldKey).not.toHaveBeenCalled()
      expectUntouched(input)
    })

  it('closes on Escape, leaving the focus in the field', async () => {
    const { openContextMenu } = await renderMenu()
    const input = focusedField()
    const onFieldKey = vi.fn()
    input.addEventListener('keydown', onFieldKey)

    act(() => openContextMenu(10, 20, [
      { label: 'Save', action: vi.fn() }
    ]))
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(menu()).toBeNull()
    expect(onFieldKey).not.toHaveBeenCalled()
    expectUntouched(input)
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
