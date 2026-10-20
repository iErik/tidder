import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { contextMenuParams } from '../../test/fakeTidder'

import {
  fieldAt,
  isOnSelection,
  pickTarget
} from './target'

const selected = contextMenuParams({ selectionText: 'Some text' })

// The target of a right-click with these params, on the
// selection or not, and on `field` if given
function pick(
  params: TidderContextMenuParams,
  onSelection: boolean,
  field: HTMLElement | null = null
) {
  return pickTarget({ params, onSelection, field })
}

describe('pickTarget', () => {
  it('picks the selection when the right-click is on it', () => {
    expect(pick(selected, true))
      .toEqual({ type: 'selection', text: 'Some text' })
  })

  it('ignores a selection the right-click is outside', () => {
    expect(pick(selected, false))
      .toEqual({ type: 'page' })
  })

  it('leaves a right-click with no selection to the page', () => {
    const params = contextMenuParams()

    expect(pick(params, true))
      .toEqual({ type: 'page' })
  })

  it('picks a link, at its reddit.com URL', () => {
    const params = contextMenuParams({
      linkURL: `${window.location.href}#/r/pics`,
      linkText: 'r/pics'
    })

    expect(pick(params, false)).toEqual({
      type: 'link',
      url: 'https://www.reddit.com/r/pics',
      linkText: 'r/pics'
    })
  })

  it('prefers a link to the selection it\'s in, and keeps both',
    () => {
      const params = contextMenuParams({
        linkURL: 'https://example.com/',
        linkText: 'a link',
        selectionText: 'Text with a link in it'
      })

      expect(pick(params, true)).toEqual({
        type: 'link',
        url: 'https://example.com/',
        linkText: 'a link',
        selection: 'Text with a link in it'
      })
    })

  it('keeps the link\'s own text for part of it selected', () => {
    const params = contextMenuParams({
      linkURL: 'https://example.com/',
      linkText: 'a link',
      selectionText: 'lin'
    })

    expect(pick(params, true))
      .toMatchObject({ linkText: 'a link', selection: 'lin' })
  })

  it('leaves out a selection the right-click is off', () => {
    const params = contextMenuParams({
      linkURL: 'https://example.com/',
      linkText: 'a link',
      selectionText: 'Other text'
    })

    expect(pick(params, false)).toEqual({
      type: 'link',
      url: 'https://example.com/',
      linkText: 'a link'
    })
  })

  // Like the post title, which opens its link on click
  it('leaves a link to the app\'s page to the page', () => {
    const params = contextMenuParams({
      linkURL: `${window.location.href}#`,
      linkText: 'A post title'
    })

    expect(pick(params, false))
      .toEqual({ type: 'page' })
  })

  // A post card, image or embed under the cursor doesn't
  // show in the params: the page decides those
  it('leaves everything else to the page', () => {
    const params = contextMenuParams({
      srcURL: 'https://i.redd.it/image.jpg',
      mediaType: 'image'
    })

    expect(pick(params, false))
      .toEqual({ type: 'page' })
  })

  it('picks a text field, with its edit flags', () => {
    const params = contextMenuParams({ isEditable: true })

    expect(pick(params, false)).toEqual({
      type: 'field',
      editFlags: params.editFlags
    })
  })

  it('ranks a text field above the selection', () => {
    const params = contextMenuParams({
      isEditable: true,
      selectionText: 'Some text'
    })

    expect(pick(params, true).type)
      .toBe('field')
  })

  it('ranks a text field above an image', () => {
    const params = contextMenuParams({
      isEditable: true,
      srcURL: 'https://i.redd.it/image.jpg',
      mediaType: 'image'
    })

    expect(pick(params, false).type)
      .toBe('field')
  })

  // Like a contenteditable with a link in it
  it('ranks a text field above a link', () => {
    const params = contextMenuParams({
      isEditable: true,
      linkURL: 'https://example.com/',
      linkText: 'a link'
    })

    expect(pick(params, false).type)
      .toBe('field')
  })

  // What Electron reports for a read-only field: not
  // editable, with every edit flag it allows
  const readOnlyParams = contextMenuParams({
    editFlags: {
      ...contextMenuParams().editFlags,
      canCopy: true,
      canCut: true,
      canPaste: true,
      canSelectAll: true
    }
  })

  it('picks a read-only field, without Cut and Paste', () => {
    const input = document.createElement('input')
    input.readOnly = true
    input.value = 'Some text'

    expect(pick(readOnlyParams, false, input)).toEqual({
      type: 'field',
      editFlags: {
        ...readOnlyParams.editFlags,
        canCut: false,
        canPaste: false
      }
    })
  })

  it('leaves out Select all in an empty read-only field', () => {
    const textarea = document.createElement('textarea')
    textarea.readOnly = true

    expect(pick(readOnlyParams, false, textarea)).toMatchObject({
      type: 'field',
      editFlags: { canSelectAll: false }
    })
  })

  it('picks a field Electron reports as not editable', () => {
    const params = contextMenuParams()
    const textarea = document.createElement('textarea')

    expect(pick(params, false, textarea)).toEqual({
      type: 'field',
      editFlags: params.editFlags
    })
  })
})

describe('fieldAt', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  // The element marked data-at in the markup, in the document,
  // where an editable's children are editable too
  function element(html: string) {
    document.body.innerHTML = html
    return document.querySelector('[data-at]')
  }

  it.each([
    ['a text input', '<input data-at>'],
    ['a search input', '<input type="search" data-at>'],
    ['a textarea', '<textarea data-at></textarea>'],
    ['a read-only input', '<input readonly data-at>'],
    [
      'inside an editable',
      '<div contenteditable="true"><b data-at></b></div>'
    ]
  ])('finds %s', (_, html) => {
    expect(fieldAt(element(html))).not.toBeNull()
  })

  it.each([
    ['a checkbox', '<input type="checkbox" data-at>'],
    ['a disabled input', '<input disabled data-at>'],
    ['a disabled textarea', '<textarea disabled data-at></textarea>'],
    ['a button', '<button data-at></button>'],
    ['plain text', '<p data-at></p>']
  ])('finds no field in %s', (_, html) => {
    expect(fieldAt(element(html))).toBeNull()
  })
})

interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

function stubSelection(
  rects: Rect[][],
  isCollapsed = false
) {
  vi.spyOn(window, 'getSelection').mockReturnValue({
    isCollapsed,
    rangeCount: rects.length,
    getRangeAt: (i: number) => ({ getClientRects: () => rects[i] })
  } as unknown as Selection)
}

const line = { left: 0, top: 0, right: 50, bottom: 10 }
const nextLine = { left: 0, top: 10, right: 30, bottom: 20 }

describe('isOnSelection', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('is false with nothing selected', () => {
    stubSelection([[line]], true)

    expect(isOnSelection(10, 5)).toBe(false)
  })

  it('is true on any line of the selection', () => {
    stubSelection([[line, nextLine]])

    expect(isOnSelection(10, 5)).toBe(true)
    expect(isOnSelection(20, 15)).toBe(true)
  })

  it('is false beside the selection', () => {
    stubSelection([[line, nextLine]])

    expect(isOnSelection(40, 15)).toBe(false)
  })

  it('checks every range', () => {
    stubSelection([[line], [nextLine]])

    expect(isOnSelection(20, 15)).toBe(true)
  })
})
