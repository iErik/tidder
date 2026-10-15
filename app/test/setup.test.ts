// Checks the renderer test setup itself: the fake bridge,
// the import aliases and Testing Library

import {
  act,
  renderHook
} from '@testing-library/react'

import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  setSetting,
  useSetting
} from 'core/useSetting'

import {
  installFakeTidder,
  tidder
} from './fakeTidder'

// Taken at import time, like core/useSetting does
const settings = window.tidder.settings

describe('fake window.tidder', () => {
  it('is installed without the test setting it up', () => {
    expect(vi.isMockFunction(tidder().openExternal))
      .toBe(true)
    expect(window.tidder.settings.get('appTheme'))
      .toBe('cupcake')
  })

  it('can be overridden by a test', async () => {
    tidder().auth.refresh.mockResolvedValue({
      accessToken: 'token',
      expiresIn: 3600
    })

    await expect(window.tidder.auth.refresh())
      .resolves.toEqual({ accessToken: 'token', expiresIn: 3600 })
  })

  it('resets the objects modules already hold', () => {
    settings.set('appTheme', 'night')
    installFakeTidder()

    expect(settings.get('appTheme')).toBe('cupcake')
    expect(tidder().settings.set).not.toHaveBeenCalled()
  })
})

describe('useSetting', () => {
  it('re-renders when the setting changes', () => {
    const { result } = renderHook(() => useSetting('appTheme'))
    expect(result.current).toBe('cupcake')

    act(() => setSetting('appTheme', 'night'))
    expect(result.current).toBe('night')
  })
})
