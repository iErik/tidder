import { createRequire } from 'node:module'

import {
  describe,
  expect,
  it
} from 'vitest'

const require = createRequire(import.meta.url)

const STATE = 'expected-state'

// A request to the local server, on the redirect URI's
// address
function callback(path, params = { }) {
  const url = new URL(path, 'http://127.0.0.1:65010')
  url.search = new URLSearchParams(params).toString()
  return url
}

function parse(url, expectedState = STATE) {
  const { parseCallback } = require('./browser-login.js')
  return parseCallback(url, expectedState)
}

describe('parseCallback', () => {
  it('is not-found for a path other than the redirect', () => {
    expect(parse(callback('/favicon.ico', { state: STATE })))
      .toEqual({ type: 'not-found' })
  })

  it('is invalid for a wrong state', () => {
    expect(parse(callback('/callback', {
      state: 'other',
      code: 'code'
    }))).toEqual({ type: 'invalid' })
  })

  it('is invalid without a state', () => {
    expect(parse(callback('/callback', { code: 'code' })))
      .toEqual({ type: 'invalid' })
  })

  it('is invalid once the login has used its redirect', () => {
    expect(parse(callback('/callback', {
      state: STATE,
      code: 'code'
    }), null)).toEqual({ type: 'invalid' })
  })

  it('is denied when the user declines', () => {
    expect(parse(callback('/callback', {
      state: STATE,
      error: 'access_denied'
    }))).toEqual({ type: 'denied' })
  })

  it('is an error for any other error from Reddit', () => {
    expect(parse(callback('/callback', {
      state: STATE,
      error: 'invalid_scope'
    }))).toEqual({ type: 'error', reason: 'invalid_scope' })
  })

  it('is an error without a code', () => {
    expect(parse(callback('/callback', { state: STATE })))
      .toEqual({ type: 'error', reason: 'no code' })
  })

  it('is the code for a valid redirect', () => {
    expect(parse(callback('/callback', {
      state: STATE,
      code: 'the-code'
    }))).toEqual({ type: 'code', code: 'the-code' })
  })
})
