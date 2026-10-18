import {
  describe,
  expect,
  it
} from 'vitest'

import { tidder } from '../../test/fakeTidder'

import { defaultMenuItems, withInspect } from './menus'

const save = { label: 'Save', action: () => { } }

describe('withInspect', () => {
  it('adds nothing outside dev mode', () => {
    expect(withInspect([save], 10, 20)).toEqual([save])
  })

  it('adds Inspect last in dev mode', () => {
    tidder().isDev = true

    const items = withInspect([save], 10, 20)

    expect(items.map(({ label }) => label))
      .toEqual(['Save', 'Inspect'])
  })

  it('inspects the point that was right-clicked', () => {
    tidder().isDev = true

    withInspect([], 10, 20)[0].action()

    expect(tidder().contextMenu.inspect).toHaveBeenCalledWith(10, 20)
  })
})

describe('defaultMenuItems', () => {
  it('is empty outside dev mode', () => {
    expect(defaultMenuItems(10, 20)).toEqual([])
  })

  it('is only Inspect in dev mode', () => {
    tidder().isDev = true

    expect(defaultMenuItems(10, 20).map(({ label }) => label))
      .toEqual(['Inspect'])
  })
})
