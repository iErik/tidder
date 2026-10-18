import {
  describe,
  expect,
  it
} from 'vitest'

import { placeMenu } from './placeMenu'

const MENU = { width: 100, height: 150 }
const WINDOW = { width: 800, height: 600 }

describe('placeMenu', () => {
  it('opens below and to the right of the point', () => {
    expect(placeMenu(10, 20, MENU, WINDOW))
      .toEqual({ left: 10, top: 20 })
  })

  it('flips left at the right edge', () => {
    expect(placeMenu(750, 20, MENU, WINDOW))
      .toEqual({ left: 650, top: 20 })
  })

  it('flips up at the bottom edge', () => {
    expect(placeMenu(10, 500, MENU, WINDOW))
      .toEqual({ left: 10, top: 350 })
  })

  it('fits exactly against the edges without flipping', () => {
    expect(placeMenu(700, 450, MENU, WINDOW))
      .toEqual({ left: 700, top: 450 })
  })

  it('stays inside a window too small to flip in', () => {
    const small = { width: 120, height: 160 }

    expect(placeMenu(60, 80, MENU, small))
      .toEqual({ left: 20, top: 10 })
  })
})
