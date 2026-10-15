import { useSyncExternalStore } from 'react'

import { onUnauthorized, redditFetch, RedditApiError } from 'api/client'
import { clearThingChanges } from 'api/thingState'
import type { Identity } from 'api/types'

import { queryClient } from 'core/queryClient'
import {
  clearTokens,
  getExpiresAt,
  hasValidToken,
  storeTokens,
} from 'core/session'

// Refresh the access token this long before it expires, and wait this long
// before retrying when Reddit can't be reached.
const REFRESH_MARGIN = 5 * 60 * 1000
const REFRESH_RETRY_DELAY = 60 * 1000

export interface LoginStatus {
  state: 'idle' | 'waiting' | 'error'
  message?: string
}

export interface AuthState {
  // True while the session is being restored or checked; the app shows
  // neither the feed nor the login screen meanwhile.
  updating: boolean

  // Whether there's a session, not whether the access token is still valid:
  // after the computer sleeps, or while Reddit can't be reached, the token
  // may have expired while a refresh is still pending.
  loggedIn: boolean

  loginStatus: LoginStatus
  user: Identity | null
}

let state: AuthState = {
  updating: true,
  loggedIn: false,
  loginStatus: { state: 'idle' },
  user: null
}

const listeners = new Set<() => void>()
let refreshTimer: ReturnType<typeof setTimeout> | undefined
let pendingRefresh: Promise<void> | null = null

// Bumped on logout, so a refresh or identity request that was already in
// flight can't log the user back in.
let sessionId = 0

function setState(patch: Partial<AuthState>): void {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, () => state)
}

export function getAuthState(): AuthState {
  return state
}

// Restores the session on startup. Called once, from main.tsx.
export function setup(): void {
  onUnauthorized(() => void refreshSession())

  if (hasValidToken()) {
    setState({ loggedIn: true })
    scheduleRefresh()
    void getIdentity()
    return
  }

  // The access token is gone or expired; the main process may still have
  // a refresh token from a previous session to log in with silently.
  setState({ updating: true })
  const session = sessionId

  void window.tidder.auth.refresh().then((result) => {
    if (session !== sessionId) return

    if (!result) {
      setState({ updating: false })
    } else if ('error' in result) {
      // There's a session, but Reddit couldn't be reached. Stay logged in
      // and keep retrying rather than asking the user to log in again.
      setState({ loggedIn: true, updating: false })
      scheduleRefresh(REFRESH_RETRY_DELAY)
    } else {
      acceptTokens(result)
      void getIdentity()
    }
  })
}

async function getIdentity(): Promise<void> {
  setState({ updating: true })
  const session = sessionId

  try {
    const user = await redditFetch<Identity>('/api/v1/me.json')
    if (session !== sessionId) return

    setState({ user, loggedIn: true, updating: false })
  } catch (err) {
    if (session !== sessionId) return

    // Reddit rejected the token (revoked or expired), so the user is
    // effectively logged out and should see the login screen again.
    if (err instanceof RedditApiError
      && (err.status === 401 || err.status === 403))
      logout()
    else
      setState({ updating: false })
  }
}

// Opens Reddit's login page in the system browser. The main process
// (see electron/auth/browser-login.js) waits for Reddit to redirect back.
export function login(): void {
  if (state.loginStatus.state === 'waiting') {
    // Already waiting: this just opens the login page in the browser again.
    void window.tidder.auth.login()
    return
  }

  setState({ loginStatus: { state: 'waiting' } })

  void window.tidder.auth.login().then((result) => {
    if (!result) {
      setState({ loginStatus: { state: 'idle' } })
    } else if ('error' in result) {
      setState({ loginStatus: { state: 'error', message: result.error } })
    } else {
      setState({ loginStatus: { state: 'idle' } })
      acceptTokens(result)
      void getIdentity()
    }
  })
}

export function cancelLogin(): void {
  window.tidder.auth.cancel()
}

export function logout(): void {
  sessionId++
  clearTimeout(refreshTimer)
  pendingRefresh = null

  clearTokens()
  void window.tidder.auth.logout()

  // Nothing fetched for this account should be shown to the next one.
  queryClient.clear()
  clearThingChanges()
  location.hash = ''

  setState({ user: null, loggedIn: false, updating: false })
}

function acceptTokens(tokens: TidderAuthTokens): void {
  storeTokens(tokens)
  setState({ loggedIn: true })
  scheduleRefresh()
}

// Access tokens last an hour; they're renewed shortly before expiring.
function scheduleRefresh(delay?: number): void {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(
    () => void refreshSession(),
    delay ?? Math.max(getExpiresAt() - REFRESH_MARGIN - Date.now(), 0))
}

// Also called when Reddit rejects the access token mid-session. Concurrent
// callers share one refresh.
function refreshSession(): Promise<void> {
  if (!state.loggedIn) return Promise.resolve()

  if (!pendingRefresh) {
    const session = sessionId

    pendingRefresh = window.tidder.auth.refresh().then((result) => {
      if (session !== sessionId) return
      pendingRefresh = null

      if (!result)
        logout()
      else if ('error' in result)
        scheduleRefresh(REFRESH_RETRY_DELAY)
      else
        acceptTokens(result)
    })
  }

  return pendingRefresh
}
