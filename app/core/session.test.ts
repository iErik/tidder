import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  clearTokens,
  getAccessToken,
  getExpiresAt,
  hasValidToken,
  storeTokens
} from './session'

const NOW = new Date('2026-01-01T12:00:00Z').getTime()

describe('session', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('has no token or expiry to begin with', () => {
    expect(getAccessToken()).toBeNull()
    expect(getExpiresAt()).toBe(0)
    expect(hasValidToken()).toBe(false)
  })

  it('stores the token with its expiry time', () => {
    storeTokens({ accessToken: 'token', expiresIn: 3600 })

    expect(getAccessToken()).toBe('token')
    expect(getExpiresAt()).toBe(NOW + 3600 * 1000)
    expect(localStorage.getItem('expires_at'))
      .toBe(String(NOW + 3600 * 1000))
  })

  it('is valid until the token expires', () => {
    storeTokens({ accessToken: 'token', expiresIn: 60 })
    expect(hasValidToken()).toBe(true)

    vi.setSystemTime(NOW + 59_999)
    expect(hasValidToken()).toBe(true)

    vi.setSystemTime(NOW + 60_000)
    expect(hasValidToken()).toBe(false)
  })

  it('treats an unreadable expiry as expired', () => {
    localStorage.setItem('expires_at', 'soon')
    expect(getExpiresAt()).toBe(0)
  })

  it('clears the token and its expiry', () => {
    storeTokens({ accessToken: 'token', expiresIn: 3600 })
    clearTokens()

    expect(getAccessToken()).toBeNull()
    expect(hasValidToken()).toBe(false)
  })
})
