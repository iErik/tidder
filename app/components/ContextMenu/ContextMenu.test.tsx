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

import type { ContextMenuItem } from 'core/contextMenu'

import {
  contextMenuParams,
  forwardRightClick,
  tidder
} from '../../test/fakeTidder'

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

// A right-click on the element, as in the app: the event,
// then the main process forwarding what it landed on
function rightClick(
  target: Element = document.body,
  params: Partial<TidderContextMenuParams> = { }
) {
  const shown = fireEvent.contextMenu(
    target,
    { clientX: 10, clientY: 20 }
  )
  vi.spyOn(document, 'elementFromPoint').mockReturnValue(target)
  act(() => forwardRightClick(params))

  return shown
}

// Text selected around (10, 20), or away from it
function selectText(underCursor = true) {
  const rect = underCursor
    ? { left: 0, top: 0, right: 50, bottom: 30 }
    : { left: 100, top: 100, right: 150, bottom: 130 }

  vi.spyOn(window, 'getSelection').mockReturnValue({
    isCollapsed: false,
    rangeCount: 1,
    getRangeAt: () => ({ getClientRects: () => [rect] })
  } as unknown as Selection)
}

// An element in the page for the test, removed afterwards
const added: Element[] = []

function appended<T extends Element>(element: T): T {
  added.push(element)
  return document.body.appendChild(element)
}

// An element with a menu of its own, like a post card
function withMenu(
  openContextMenu: (
    x: number,
    y: number,
    items: readonly ContextMenuItem[]
  ) => void
) {
  const element = appended(document.createElement('div'))
  element.addEventListener('contextmenu', () => {
    openContextMenu(10, 20, [{ label: 'Save', action: vi.fn() }])
  })

  return element
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  added.splice(0).forEach((element) => element.remove())
})

describe('ContextMenu', () => {
  it('opens nothing outside dev mode', async () => {
    await renderMenu()

    rightClick()

    expect(menu()).toBeNull()
  })

  it('leaves a right-click uncancelled, so Electron forwards it',
    async () => {
      await renderMenu()

      // fireEvent returns false once preventDefault was called
      expect(fireEvent.contextMenu(document.body)).toBe(true)
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

    rightClick(withMenu(openContextMenu))

    expect(labels()).toEqual(['Save'])
  })

  it('shows a component the right-click once it\'s forwarded',
    async () => {
      await renderMenu()
      const target = appended(document.createElement('div'))
      const seen = vi.fn()
      target.addEventListener('contextmenu', seen)

      fireEvent.contextMenu(target)
      expect(seen).not.toHaveBeenCalled()

      vi.spyOn(document, 'elementFromPoint').mockReturnValue(target)
      act(() => forwardRightClick())
      expect(seen).toHaveBeenCalledTimes(1)
    })

  it('keeps the focus and selection on a right mousedown', async () => {
    await renderMenu()
    const text = appended(document.createElement('p'))

    const right = fireEvent.mouseDown(text, { button: 2 })
    const left = fireEvent.mouseDown(text, { button: 0 })

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

    act(() => forwardRightClick({ isSubframe: true }))

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

    act(() => forwardRightClick({ isSubframe: true }))

    expect(fromPoint).toHaveBeenCalledWith(10, 20)
    expect(points).toEqual([[10, 20]])
    expect(labels()).toEqual(['Copy URL'])
  })

  it('opens Copy text for a right-click on the selection', async () => {
    tidder().isDev = true
    await renderMenu()
    selectText()

    rightClick(document.body, { selectionText: 'Some text' })

    expect(labels()).toEqual(['Copy text', 'Inspect'])
  })

  it('prefers Copy text to a post card\'s menu', async () => {
    const { openContextMenu } = await renderMenu()
    selectText()

    rightClick(
      withMenu(openContextMenu),
      { selectionText: 'Some text' }
    )

    expect(labels()).toEqual(['Copy text'])
  })

  it('ignores a selection the right-click is outside', async () => {
    const { openContextMenu } = await renderMenu()
    selectText(false)

    rightClick(
      withMenu(openContextMenu),
      { selectionText: 'Some text' }
    )

    expect(labels()).toEqual(['Save'])
  })

  it('copies the selection', async () => {
    await renderMenu()
    selectText()

    rightClick(document.body, { selectionText: 'Some text' })
    fireEvent.click(screen.getByText('Copy text'))

    expect(tidder().contextMenu.writeText)
      .toHaveBeenCalledWith('Some text')
  })

  it('opens the link menu for a right-click on a link', async () => {
    tidder().isDev = true
    await renderMenu()

    rightClick(document.body, { linkURL: 'https://example.com/' })

    expect(labels()).toEqual([
      'Open in browser', 'Copy link', 'Copy link\'s text', 'Inspect'
    ])
  })

  it('prefers the link menu to a post card\'s', async () => {
    const { openContextMenu } = await renderMenu()

    rightClick(
      withMenu(openContextMenu),
      { linkURL: 'https://example.com/' }
    )

    expect(labels()).toEqual([
      'Open in browser', 'Copy link', 'Copy link\'s text'
    ])
  })

  it('copies an in-app link\'s reddit.com URL', async () => {
    await renderMenu()

    rightClick(document.body, {
      linkURL: `${window.location.href}#/r/pics`
    })
    fireEvent.click(screen.getByText('Copy link'))

    expect(tidder().contextMenu.writeText)
      .toHaveBeenCalledWith('https://www.reddit.com/r/pics')
  })

  it('copies the selection a link is in', async () => {
    await renderMenu()
    selectText()

    rightClick(document.body, {
      linkURL: 'https://example.com/',
      linkText: 'a link',
      selectionText: 'Text with a link in it'
    })
    fireEvent.click(screen.getByText('Copy selection'))

    expect(tidder().contextMenu.writeText)
      .toHaveBeenCalledWith('Text with a link in it')
  })

  it('keeps a post card\'s menu on an href="#" link', async () => {
    const { openContextMenu } = await renderMenu()

    rightClick(
      withMenu(openContextMenu),
      { linkURL: `${window.location.href}#` }
    )

    expect(labels()).toEqual(['Save'])
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

      expect(labels()).toEqual(
        ['Copy', 'Paste', 'Cut', 'Select all', 'Inspect']
      )
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

// What Electron reports for a right-click on a field with
// text selected, the clipboard holding text
const fieldParams = contextMenuParams({
  isEditable: true,
  editFlags: {
    ...contextMenuParams().editFlags,
    canCopy: true,
    canPaste: true,
    canCut: true,
    canSelectAll: true
  }
})

// The same, on a field with only a caret: nothing to copy or
// cut
const caretParams = {
  ...fieldParams,
  editFlags: {
    ...fieldParams.editFlags,
    canCopy: false,
    canCut: false
  }
}

// A right-click on a text field, as in the app: the right
// button's mousedown, then the right-click. Gives whether the
// mousedown was let through, which lets the focus move.
function rightClickField(
  field: Element,
  params: Partial<TidderContextMenuParams> = fieldParams
) {
  const focusAllowed = fireEvent.mouseDown(field, { button: 2 })
  rightClick(field, params)

  return focusAllowed
}

const disabledLabels = () => screen.queryAllByRole('menuitem')
  .filter((item) => item.getAttribute('aria-disabled'))
  .map((item) => item.textContent)

describe('ContextMenu text fields', () => {
  it('opens Copy, Paste, Cut and Select all', async () => {
    tidder().isDev = true
    await renderMenu()

    rightClickField(appended(document.createElement('textarea')))

    expect(labels())
      .toEqual(['Copy', 'Paste', 'Cut', 'Select all', 'Inspect'])
  })

  it('disables what the edit flags rule out', async () => {
    await renderMenu()

    rightClickField(
      appended(document.createElement('input')),
      caretParams
    )

    expect(disabledLabels()).toEqual(['Copy', 'Cut'])
  })

  // Electron reports one as not editable
  it('opens a read-only field\'s menu', async () => {
    await renderMenu()
    const input = appended(document.createElement('input'))
    input.readOnly = true
    input.value = 'Some text'

    rightClickField(input, { ...fieldParams, isEditable: false })

    expect(labels()).toEqual(['Copy', 'Paste', 'Cut', 'Select all'])
    expect(disabledLabels()).toEqual(['Paste', 'Cut'])
  })

  // It can't take the focus, so a field menu would act on
  // another field, or on nothing
  it('opens no field menu on a disabled field', async () => {
    await renderMenu()
    const input = appended(document.createElement('input'))
    input.disabled = true

    rightClickField(input, { ...fieldParams, isEditable: false })

    expect(labels()).not.toContain('Copy')
  })

  it('prefers the field\'s menu to a post card\'s', async () => {
    const { openContextMenu } = await renderMenu()
    const field = withMenu(openContextMenu)
      .appendChild(document.createElement('input'))

    rightClickField(field)

    expect(labels()).toEqual(['Copy', 'Paste', 'Cut', 'Select all'])
  })

  it('acts on field B, not the focused field A', async () => {
    await renderMenu()
    const a = focusedField()
    const b = appended(document.createElement('input'))
    b.value = 'other text'
    // The field each command ran on
    const ranOn: (Element | null)[] = []
    tidder().contextMenu.edit.mockImplementation(() => {
      ranOn.push(document.activeElement)
    })

    // fireEvent returns false once preventDefault was called,
    // which would stop the caret moving to the click
    expect(rightClickField(b, caretParams)).toBe(true)
    expect(document.activeElement).toBe(b)

    // Electron reports the edit flags of the focused field,
    // now B. B has only a caret, so Copy and Cut are off,
    // though A has text selected.
    expect(disabledLabels()).toEqual(['Copy', 'Cut'])

    b.setSelectionRange(0, 5)
    for (const label of ['Copy', 'Paste', 'Cut', 'Select all']) {
      rightClickField(b)
      fireEvent.click(screen.getByText(label))
    }

    expect(tidder().contextMenu.edit.mock.calls)
      .toEqual([['copy'], ['paste'], ['cut'], ['selectAll']])
    expect(ranOn).toEqual([b, b, b, b])
    expect(a.selectionStart).toBe(2)
  })

  it('focuses a right-clicked editable', async () => {
    await renderMenu()
    const editable = appended(document.createElement('div'))
    editable.contentEditable = 'true'
    const child = editable.appendChild(document.createElement('b'))

    rightClickField(child)

    expect(document.activeElement).toBe(editable)
  })

  it('leaves fields that take no text unfocused', async () => {
    await renderMenu()
    const a = focusedField()
    const checkbox = appended(document.createElement('input'))
    checkbox.type = 'checkbox'

    expect(fireEvent.mouseDown(checkbox, { button: 2 })).toBe(false)
    expectUntouched(a)
  })

  it('keeps the focused field\'s selection', async () => {
    await renderMenu()
    const input = focusedField()

    expect(rightClickField(input)).toBe(false)
    expectUntouched(input)
    expect(labels()).toEqual(['Copy', 'Paste', 'Cut', 'Select all'])
  })

  it('keeps the field\'s focus when an item is chosen', async () => {
    await renderMenu()
    const input = focusedField()

    rightClickField(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(tidder().contextMenu.edit).toHaveBeenCalledWith('copy')
    expectUntouched(input)
  })
})
