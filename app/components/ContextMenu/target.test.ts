import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { contextMenuParams } from '../../test/fakeTidder'

import { isOnSelection, pickTarget } from './target'

const selected = contextMenuParams({ selectionText: 'Some text' })

describe('pickTarget', () => {
  it('picks the selection when the right-click is on it', () => {
    expect(pickTarget({ params: selected, onSelection: true }))
      .toEqual({ type: 'selection', text: 'Some text' })
  })

  it('ignores a selection the right-click is outside', () => {
    expect(pickTarget({ params: selected, onSelection: false }))
      .toEqual({ type: 'page' })
  })

  it('leaves a right-click with no selection to the page', () => {
    const params = contextMenuParams()

    expect(pickTarget({ params, onSelection: true }))
      .toEqual({ type: 'page' })
  })

  it('picks a link, at its reddit.com URL', () => {
    const params = contextMenuParams({
      linkURL: `${window.location.href}#/r/pics`,
      linkText: 'r/pics'
    })

    expect(pickTarget({ params, onSelection: false })).toEqual({
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

      expect(pickTarget({ params, onSelection: true })).toEqual({
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

    expect(pickTarget({ params, onSelection: true }))
      .toMatchObject({ linkText: 'a link', selection: 'lin' })
  })

  it('leaves out a selection the right-click is off', () => {
    const params = contextMenuParams({
      linkURL: 'https://example.com/',
      linkText: 'a link',
      selectionText: 'Other text'
    })

    expect(pickTarget({ params, onSelection: false })).toEqual({
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

    expect(pickTarget({ params, onSelection: false }))
      .toEqual({ type: 'page' })
  })

  // A post card, image or embed under the cursor doesn't
  // show in the params: the page decides those
  it('leaves everything else to the page', () => {
    const params = contextMenuParams({
      srcURL: 'https://i.redd.it/image.jpg',
      mediaType: 'image'
    })

    expect(pickTarget({ params, onSelection: false }))
      .toEqual({ type: 'page' })
  })

  it('picks a text field, with its edit flags', () => {
    const params = contextMenuParams({ isEditable: true })

    expect(pickTarget({ params, onSelection: false })).toEqual({
      type: 'field',
      editFlags: params.editFlags
    })
  })

  it('ranks a text field above the selection', () => {
    const params = contextMenuParams({
      isEditable: true,
      selectionText: 'Some text'
    })

    expect(pickTarget({ params, onSelection: true }).type)
      .toBe('field')
  })

  it('ranks a text field above an image', () => {
    const params = contextMenuParams({
      isEditable: true,
      srcURL: 'https://i.redd.it/image.jpg',
      mediaType: 'image'
    })

    expect(pickTarget({ params, onSelection: false }).type)
      .toBe('field')
  })

  // Like a contenteditable with a link in it
  it('ranks a text field above a link', () => {
    const params = contextMenuParams({
      isEditable: true,
      linkURL: 'https://example.com/',
      linkText: 'a link'
    })

    expect(pickTarget({ params, onSelection: false }).type)
      .toBe('field')
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
