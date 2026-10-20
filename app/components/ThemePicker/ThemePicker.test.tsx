import {
  fireEvent,
  render,
  screen
} from '@testing-library/react'

import {
  describe,
  expect,
  it
} from 'vitest'

import { tidder } from '../../test/fakeTidder'

import ThemePicker from './ThemePicker'

function setup() {
  const view = render(
    <div>
      <p>Elsewhere</p>
      <ThemePicker />
    </div>
  )
  const trigger = view.container.querySelector('button')!
  const menu = () => screen.queryByText('Themes')
    ?.closest('div')?.parentElement ?? null

  return { trigger, menu }
}

// A real click: mousedown, then click
function click(target: Element) {
  fireEvent.mouseDown(target)
  fireEvent.click(target)
}

describe('ThemePicker', () => {
  it('fades out and unmounts on an outside mousedown', () => {
    const { trigger, menu } = setup()

    click(trigger)
    const open = menu()!
    click(screen.getByText('Elsewhere'))
    expect(open.className).toMatch(/-leaving/)

    fireEvent.animationEnd(open)
    expect(menu()).toBeNull()
  })

  it('fades out and unmounts on Escape', () => {
    const { trigger, menu } = setup()

    click(trigger)
    const open = menu()!
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(open.className).toMatch(/-leaving/)

    fireEvent.animationEnd(open)
    expect(menu()).toBeNull()
  })

  it('closes once from the trigger', () => {
    const { trigger, menu } = setup()

    click(trigger)
    const open = menu()!
    click(trigger)
    expect(open.className).toMatch(/-leaving/)

    fireEvent.animationEnd(open)
    expect(menu()).toBeNull()
  })

  it('stays open on a click on its heading', () => {
    const { trigger, menu } = setup()

    click(trigger)
    click(screen.getByText('Themes'))
    expect(menu()!.className).toMatch(/-entering/)
  })

  it('applies a chosen theme and closes', () => {
    const { trigger, menu } = setup()

    click(trigger)
    const open = menu()!
    click(screen.getByText('Mint'))
    expect(tidder().settings.set)
      .toHaveBeenCalledWith('appTheme', 'mint')
    expect(open.className).toMatch(/-leaving/)

    fireEvent.animationEnd(open)
    expect(menu()).toBeNull()
  })
})
