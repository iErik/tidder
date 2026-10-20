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
