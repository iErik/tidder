import { render, screen } from '@testing-library/react'

import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { tidder } from '../../test/fakeTidder'

// WindowControls reads the platform at import time, so each
// test sets it first and loads a fresh copy
async function renderControls(platform: string) {
  tidder().platform = platform
  vi.resetModules()

  const { default: WindowControls } =
    await import('components/WindowControls/WindowControls')

  render(<WindowControls />)
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
      expect(window.maximize).toHaveBeenCalledOnce()
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
})
