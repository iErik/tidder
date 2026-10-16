import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { tidder } from '../test/fakeTidder'
import {
  jsonResponse,
  stubFetch
} from '../test/fetch'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

const USER = { name: 'user' }
const TOKENS = { accessToken: 'new-token', expiresIn: 3600 }

// auth keeps its state, timers and pending refresh at module
// level. The client is imported with it, after the same
// reset, so the two share one unauthorized handler
async function loadAuth() {
  vi.resetModules()

  const auth = await import('core/auth')
  const client = await import('api/client')

  return { ...auth, redditFetch: client.redditFetch }
}

// A session from before the app started
function storeSession(expiresIn: number) {
  localStorage.setItem('access_token', 'old-token')
  localStorage.setItem('expires_at',
    String(Date.now() + expiresIn))
}

// Lets the code under test finish what it started: auth
// doesn't return its promises (setup() fires off the
// identity request), so a test can't await them. This isn't
// a sleep, since no time passes. setImmediate runs on the
// event loop's next turn, after every promise callback
// already queued, so awaiting it lets the stubbed fetch, its
// JSON and the state updates run. It stays real because
// only setTimeout, clearTimeout and Date are faked.
function settle() {
  return new Promise((resolve) => setImmediate(resolve))
}

// A call to the fake bridge that only answers when the test
// says so
function pending<T>() {
  let resolve: (value: T) => void = () => { }
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'Date']
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('startup with a valid token', () => {
  it('loads the user', async () => {
    storeSession(HOUR)
    const fetch = stubFetch(jsonResponse(USER))
    const auth = await loadAuth()

    auth.setup()
    await settle()

    expect(auth.getAuthState()).toMatchObject({
      loggedIn: true,
      updating: false,
      user: USER
    })
    expect((fetch.mock.calls[0][0] as URL).pathname)
      .toBe('/api/v1/me.json')
    expect(tidder().auth.refresh).not.toHaveBeenCalled()
  })

  it('refreshes 5 minutes before the token expires',
    async () => {
      storeSession(HOUR)
      stubFetch(jsonResponse(USER))
      tidder().auth.refresh.mockResolvedValue(TOKENS)
      const auth = await loadAuth()

      auth.setup()
      await settle()

      vi.advanceTimersByTime(55 * MINUTE - 1)
      expect(tidder().auth.refresh).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      await settle()
      expect(tidder().auth.refresh).toHaveBeenCalledOnce()
      expect(localStorage.getItem('access_token'))
        .toBe('new-token')

      // And again before the new token expires
      vi.advanceTimersByTime(55 * MINUTE)
      expect(tidder().auth.refresh).toHaveBeenCalledTimes(2)
    })

  it.each([401, 403])(
    'logs out when the identity request gets a %i',
    async (status) => {
      storeSession(HOUR)
      stubFetch(jsonResponse({ }, { status }))
      // A 401 also starts a refresh; it never answers here,
      // so the logout can only come from the identity request
      tidder().auth.refresh.mockReturnValue(new Promise(() => { }))
      const auth = await loadAuth()

      auth.setup()
      await settle()

      expect(auth.getAuthState()).toMatchObject({
        loggedIn: false,
        updating: false,
        user: null
      })
      expect(tidder().auth.logout).toHaveBeenCalledOnce()
      expect(localStorage.getItem('access_token')).toBeNull()
    })

  it('stays logged in when the identity request fails',
    async () => {
      storeSession(HOUR)
      stubFetch(jsonResponse({ }, { status: 500 }))
      const auth = await loadAuth()

      auth.setup()
      await settle()

      expect(auth.getAuthState()).toMatchObject({
        loggedIn: true,
        updating: false
      })
      expect(tidder().auth.logout).not.toHaveBeenCalled()
    })
})

describe('startup with an expired token', () => {
  it('refreshes silently and loads the user', async () => {
    storeSession(-MINUTE)
    stubFetch(jsonResponse(USER))
    tidder().auth.refresh.mockResolvedValue(TOKENS)
    const auth = await loadAuth()

    auth.setup()
    expect(auth.getAuthState().updating).toBe(true)
    await settle()

    expect(tidder().auth.refresh).toHaveBeenCalledOnce()
    expect(localStorage.getItem('access_token'))
      .toBe('new-token')
    expect(auth.getAuthState()).toMatchObject({
      loggedIn: true,
      updating: false,
      user: USER
    })
  })

  it('shows the login screen without a session', async () => {
    const fetch = stubFetch()
    const auth = await loadAuth()

    auth.setup()
    await settle()

    expect(auth.getAuthState()).toMatchObject({
      loggedIn: false,
      updating: false
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('stays logged in and retries when Reddit is unreachable',
    async () => {
      storeSession(-MINUTE)
      tidder().auth.refresh
        .mockResolvedValueOnce({ error: 'offline' })
      const auth = await loadAuth()

      auth.setup()
      await settle()

      expect(auth.getAuthState()).toMatchObject({
        loggedIn: true,
        updating: false
      })

      vi.advanceTimersByTime(MINUTE - 1)
      expect(tidder().auth.refresh).toHaveBeenCalledOnce()
      vi.advanceTimersByTime(1)
      expect(tidder().auth.refresh).toHaveBeenCalledTimes(2)
    })
})

describe('refreshing during a session', () => {
  // Logged in, with the first refresh due in 55 minutes
  async function loggedIn() {
    storeSession(HOUR)
    stubFetch(jsonResponse(USER))
    const auth = await loadAuth()

    auth.setup()
    await settle()
    return auth
  }

  it('logs out when the refresh fails', async () => {
    const auth = await loggedIn()
    tidder().auth.refresh.mockResolvedValue(null)

    vi.advanceTimersByTime(55 * MINUTE)
    await settle()

    expect(auth.getAuthState()).toMatchObject({
      loggedIn: false,
      user: null
    })
    expect(tidder().auth.logout).toHaveBeenCalledOnce()
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('retries a minute after a refresh error', async () => {
    const auth = await loggedIn()
    tidder().auth.refresh
      .mockResolvedValueOnce({ error: 'offline' })
      .mockResolvedValueOnce(TOKENS)

    vi.advanceTimersByTime(55 * MINUTE)
    await settle()
    expect(auth.getAuthState().loggedIn).toBe(true)

    vi.advanceTimersByTime(MINUTE - 1)
    expect(tidder().auth.refresh).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(1)
    await settle()
    expect(tidder().auth.refresh).toHaveBeenCalledTimes(2)
    expect(localStorage.getItem('access_token'))
      .toBe('new-token')
  })

  it('shares one refresh between concurrent 401s', async () => {
    const auth = await loggedIn()
    const refresh = pending<TidderAuthTokens | null>()
    tidder().auth.refresh.mockReturnValue(refresh.promise)
    stubFetch(
      jsonResponse({ }, { status: 401 }),
      jsonResponse({ }, { status: 401 }))

    await Promise.allSettled([
      auth.redditFetch('/hot.json'),
      auth.redditFetch('/new.json')
    ])
    expect(tidder().auth.refresh).toHaveBeenCalledOnce()

    refresh.resolve(TOKENS)
    await settle()
    expect(localStorage.getItem('access_token'))
      .toBe('new-token')

    // Once it's done, the next 401 starts a new one
    stubFetch(jsonResponse({ }, { status: 401 }))
    await auth.redditFetch('/hot.json').catch(() => { })
    expect(tidder().auth.refresh).toHaveBeenCalledTimes(2)
  })
})
