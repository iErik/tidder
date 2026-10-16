import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  jsonResponse,
  stubFetch,
  type FetchMock
} from '../test/fetch'

// client.ts keeps the unauthorized handler at module level
async function loadClient() {
  vi.resetModules()
  return import('api/client')
}

function request(fetch: FetchMock, call = 0) {
  const [url, init] = fetch.mock.calls[call]
  const href = url instanceof Request ? url.url : url
  return { url: new URL(href), init: init ?? { } }
}

beforeEach(() => {
  localStorage.setItem('access_token', 'token')
})

describe('redditFetch', () => {
  it('sends the access token as a bearer token', async () => {
    const fetch = stubFetch(jsonResponse({ }))
    const { redditFetch } = await loadClient()

    await redditFetch('/api/v1/me')

    expect(request(fetch).init.headers)
      .toEqual({ Authorization: 'Bearer token' })
  })

  it('sends no Authorization header without a token',
    async () => {
      localStorage.clear()
      const fetch = stubFetch(jsonResponse({ }))
      const { redditFetch } = await loadClient()

      await redditFetch('/api/v1/me')

      expect(request(fetch).init.headers).toEqual({ })
    })

  it('puts GET params in the query string', async () => {
    const fetch = stubFetch(jsonResponse({ }))
    const { redditFetch } = await loadClient()

    await redditFetch('/hot.json', {
      params: { limit: 25, after: null, before: undefined }
    })

    const { url, init } = request(fetch)
    expect(url.origin).toBe('https://oauth.reddit.com')
    expect(url.pathname).toBe('/hot.json')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      raw_json: '1',
      api_type: 'json',
      limit: '25'
    })
    expect(init.method).toBe('GET')
    expect(init.body).toBeUndefined()
  })

  it('sends other methods\' params as a form body',
    async () => {
      const fetch = stubFetch(jsonResponse({ }))
      const { redditFetch } = await loadClient()
      const id = 't3_abc'

      await redditFetch('/api/vote', {
        method: 'POST',
        params: { id, dir: 1 }
      })

      const { url, init } = request(fetch)
      expect(url.search).toBe('')
      expect(init.method).toBe('POST')
      expect(init.body).toBeInstanceOf(URLSearchParams)
      expect(Object.fromEntries(init.body as URLSearchParams))
        .toEqual({
          raw_json: '1',
          api_type: 'json',
          id,
          dir: '1'
        })
    })

  it('resolves with the parsed JSON', async () => {
    stubFetch(jsonResponse({ name: 'user' }))
    const { redditFetch } = await loadClient()

    await expect(redditFetch('/api/v1/me'))
      .resolves.toEqual({ name: 'user' })
  })

  it('resolves with null for an empty body', async () => {
    stubFetch(new Response(null, { status: 200 }))
    const { redditFetch } = await loadClient()

    await expect(redditFetch('/api/vote', { method: 'POST' }))
      .resolves.toBeNull()
  })

  it('calls the unauthorized handler on a 401', async () => {
    stubFetch(jsonResponse({ }, { status: 401 }))
    const client = await loadClient()
    const handler = vi.fn()
    client.onUnauthorized(handler)

    await expect(client.redditFetch('/api/v1/me'))
      .rejects.toMatchObject({
        name: 'RedditApiError',
        status: 401
      })
    expect(handler).toHaveBeenCalledOnce()
  })

  it('throws a RedditApiError for other errors', async () => {
    stubFetch(jsonResponse({ }, {
      status: 500,
      statusText: 'Server Error'
    }))
    const client = await loadClient()
    const handler = vi.fn()
    client.onUnauthorized(handler)

    const error: unknown = await client.redditFetch('/hot.json')
      .catch((err: unknown) => err)

    expect(error).toBeInstanceOf(client.RedditApiError)
    expect(error).toMatchObject({
      status: 500,
      message: '500 Server Error (GET /hot.json)'
    })
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('throwOnJsonErrors', () => {
  it('returns the data when there are no errors', async () => {
    const { throwOnJsonErrors } = await loadClient()

    expect(throwOnJsonErrors({
      json: { errors: [], data: { id: 'abc' } }
    })).toEqual({ id: 'abc' })
  })

  it('throws a RedditJsonError for Reddit\'s errors',
    async () => {
      const client = await loadClient()
      const errors: [string, string, string?][] = [
        ['RATELIMIT', 'you are doing that too much', 'ratelimit'],
        ['TOO_LONG', 'that is too long', 'text']
      ]

      const error: unknown = (() => {
        try {
          client.throwOnJsonErrors({ json: { errors } })
        } catch (err) {
          return err
        }
      })()

      expect(error).toBeInstanceOf(client.RedditJsonError)
      expect(error).toMatchObject({
        errors,
        message: 'you are doing that too much; that is too long'
      })
    })
})
