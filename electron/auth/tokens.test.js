import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import {
  describe,
  expect,
  it
} from 'vitest'

import { electron } from '../test/electron.js'

const require = createRequire(import.meta.url)
const config = require('../../app/config/authConfig.json')

function loadTokens() {
  return require('./tokens.js')
}

function tokenFile() {
  return path.join(electron().app.getPath('userData'), 'Auth')
}

// What a previous session left on disk
function storeToken(token) {
  fs.writeFileSync(tokenFile(),
    electron().safeStorage.encryptString(token))
}

function respond(...responses) {
  for (const response of responses)
    electron().net.fetch.mockResolvedValueOnce(response)
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

// The form fields of the nth request to net.fetch
function sentParams(call = 0) {
  const [, init] = electron().net.fetch.mock.calls[call]
  return Object.fromEntries(new URLSearchParams(init.body))
}

const TOKENS = {
  access_token: 'access',
  refresh_token: 'refresh',
  expires_in: 3600
}

describe('exchangeCode', { concurrent: false }, () => {
  it('posts the code to the token endpoint', async () => {
    respond(json(TOKENS))
    await loadTokens().exchangeCode('the-code')

    const [url, init] = electron().net.fetch.mock.calls[0]
    expect(url).toBe(config.tokenUrl)
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'Authorization': 'Basic '
        + Buffer.from(`${config.clientId}:`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': expect.stringContaining(
        'desktop:org.isidore.tidder:v0.0.0-test')
    })
    expect(sentParams()).toEqual({
      grant_type: 'authorization_code',
      code: 'the-code',
      redirect_uri: config.redirectUri
    })
  })

  it('resolves with the access token', async () => {
    respond(json(TOKENS))

    await expect(loadTokens().exchangeCode('code'))
      .resolves.toEqual({ accessToken: 'access', expiresIn: 3600 })
  })

  it('saves the refresh token encrypted', async () => {
    respond(json(TOKENS))
    await loadTokens().exchangeCode('code')

    const { safeStorage } = electron()
    expect(safeStorage.encryptString)
      .toHaveBeenCalledWith('refresh')
    expect(safeStorage.decryptString(fs.readFileSync(tokenFile())))
      .toBe('refresh')
  })

  it('only keeps the token in memory without encryption',
    async () => {
      const tokens = loadTokens()
      electron().safeStorage.isEncryptionAvailable
        .mockReturnValue(false)
      respond(json(TOKENS), json({
        access_token: 'renewed',
        expires_in: 3600
      }))

      await tokens.exchangeCode('code')
      expect(fs.existsSync(tokenFile())).toBe(false)

      await tokens.refresh()
      expect(sentParams(1).refresh_token).toBe('refresh')
    })

  it('rejects when Reddit returns an error', async () => {
    respond(json({ error: 'invalid_grant' }))

    await expect(loadTokens().exchangeCode('code'))
      .rejects.toThrow('invalid_grant')
    expect(fs.existsSync(tokenFile())).toBe(false)
  })
})

describe('refresh', { concurrent: false }, () => {
  it('is null without a stored token', async () => {
    await expect(loadTokens().refresh()).resolves.toBeNull()
    expect(electron().net.fetch).not.toHaveBeenCalled()
  })

  it('loads the stored token to refresh with', async () => {
    storeToken('stored')
    respond(json({ access_token: 'new', expires_in: 1800 }))

    await expect(loadTokens().refresh())
      .resolves.toEqual({ accessToken: 'new', expiresIn: 1800 })
    expect(electron().safeStorage.decryptString)
      .toHaveBeenCalled()
    expect(electron().net.fetch.mock.calls[0][0])
      .toBe(config.tokenUrl)
    expect(sentParams()).toEqual({
      grant_type: 'refresh_token',
      refresh_token: 'stored'
    })
  })

  it.each([
    ['a 400', json({ error: 'invalid_request' }, 400)],
    ['a 401', json({ }, 401)],
    ['invalid_grant', json({ error: 'invalid_grant' })]
  ])('clears the token when Reddit rejects it (%s)',
    async (_, response) => {
      storeToken('stored')
      respond(response)

      await expect(loadTokens().refresh()).resolves.toBeNull()
      expect(fs.existsSync(tokenFile())).toBe(false)
    })

  it('keeps the token when Reddit fails', async () => {
    storeToken('stored')
    respond(json({ }, 503))

    await expect(loadTokens().refresh())
      .resolves.toEqual({ error: expect.stringContaining('503') })
    expect(fs.existsSync(tokenFile())).toBe(true)
  })

  it("keeps the token when Reddit can't be reached",
    async () => {
      storeToken('stored')

      // The fake's net.fetch rejects unless stubbed
      await expect(loadTokens().refresh())
        .resolves.toEqual({ error: 'net.fetch is not stubbed' })
      expect(fs.existsSync(tokenFile())).toBe(true)
    })
})

describe('logout', { concurrent: false }, () => {
  it('clears the stored token and revokes it', async () => {
    storeToken('stored')
    respond(new Response(null, { status: 200 }))

    await loadTokens().logout()

    expect(fs.existsSync(tokenFile())).toBe(false)
    expect(electron().net.fetch.mock.calls[0][0])
      .toBe(config.revokeUrl)
    expect(sentParams()).toEqual({
      token: 'stored',
      token_type_hint: 'refresh_token'
    })
  })

  it('forgets the token even if revoking fails', async () => {
    storeToken('stored')
    const tokens = loadTokens()

    await tokens.logout()

    expect(fs.existsSync(tokenFile())).toBe(false)
    await expect(tokens.refresh()).resolves.toBeNull()
  })

  it("doesn't revoke without a token", async () => {
    await loadTokens().logout()
    expect(electron().net.fetch).not.toHaveBeenCalled()
  })
})
