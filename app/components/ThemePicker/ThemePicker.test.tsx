import {
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

  it('names its trigger and says whether the menu is open', () => {
    const { trigger } = setup()
    const expanded = () => trigger.getAttribute('aria-expanded')

    expect(screen.getByRole('button', { name: 'Choose theme' }))
      .toBe(trigger)
    expect(expanded()).toBe('false')

    click(trigger)
    expect(expanded()).toBe('true')

    // Already closed while it fades out
    click(trigger)
    expect(expanded()).toBe('false')
  })
})

// happy-dom plays no CSS animations, so the tests above end
// them by hand (see "ThemePicker styles" below)
describe('ThemePicker with reduced motion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('closes at once, with no fade-out to wait for', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(
      { matches: true } as MediaQueryList
    )
    const { trigger, menu } = setup()

    click(trigger)
    click(screen.getByText('Elsewhere'))

    expect(menu()).toBeNull()
  })
})

// The menu unmounts when its fade-out ends, which happy-dom
// can't play, so this checks the stylesheet gives it one that
// can end. Vitest leaves stylesheets empty, so it reads the
// source.
describe('ThemePicker styles', () => {
  async function source() {
    const fs = await vi.importActual<{
      readFileSync(path: string, encoding: 'utf8'): string
    }>('node:fs')

    return fs.readFileSync(
      'app/components/ThemePicker/ThemePicker.module.scss',
      'utf8'
    )
  }

  // The keyframes a variant's animation plays
  function keyframes(scss: string, variant: string) {
    const rule = new RegExp(
      `&\\.${variant}\\s*\\{\\s*animation:\\s*([\\w-]+)`
    )
    return scss.match(rule)?.[1]
  }

  // Chromium doesn't restart an animation when only its
  // direction changes, so a reversed fade-in never ends
  it('fades out with keyframes of its own', async () => {
    const scss = await source()

    expect(keyframes(scss, '-entering')).toBe('fade-in')
    expect(keyframes(scss, '-leaving')).toBe('fade-out')
  })
})
