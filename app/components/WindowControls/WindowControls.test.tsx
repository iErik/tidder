import {
  act,
  render,
  screen
} from '@testing-library/react'

import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  changeMaximized,
  tidder
} from '../../test/fakeTidder'

// WindowControls reads the platform at import time, so each
// test sets it first and loads a fresh copy
async function renderControls(platform: string) {
  tidder().platform = platform
  vi.resetModules()

  const { default: WindowControls } =
    await import('components/WindowControls/WindowControls')

  render(<WindowControls />)

  // Lets the window's initial maximized state arrive
  await act(() => Promise.resolve())
}

const button = (name: string) =>
  screen.getByRole('button', { name })

describe('WindowControls', () => {
  it.each(['linux', 'darwin'])(
    'labels each control by its action on %s',
    async (platform) => {
      await renderControls(platform)

      button('Maximize window').click()
      button('Minimize window').click()
      button('Close window').click()

      const { window } = tidder()
      expect(window.toggleMaximize).toHaveBeenCalledOnce()
      expect(window.minimize).toHaveBeenCalledOnce()
      expect(window.close).toHaveBeenCalledOnce()
    }
  )

  it('keeps the traffic-light icons on darwin', async () => {
    await renderControls('darwin')

    const icon = button('Close window')
      .querySelector('.icon-close-darwin')

    expect(icon).not.toBeNull()
  })

  it.each([
    ['linux', 'unmaximize'],
    ['darwin', 'unmaximize-darwin']
  ])(
    'offers to restore a maximized window on %s',
    async (platform, iconName) => {
      tidder().window.isMaximized.mockResolvedValue(true)
      await renderControls(platform)

      const restore = button('Restore window')
      restore.click()

      const icon = restore.querySelector(`.icon-${iconName}`)
      expect(icon).not.toBeNull()
      expect(tidder().window.toggleMaximize).toHaveBeenCalledOnce()
    }
  )

  it('follows a change made outside the button', async () => {
    await renderControls('linux')

    act(() => changeMaximized(true))
    expect(button('Restore window')).toBeDefined()

    act(() => changeMaximized(false))
    const icon = button('Maximize window')
      .querySelector('.icon-maximize')

    expect(icon).not.toBeNull()
  })
})
