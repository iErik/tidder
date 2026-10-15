// The renderer talks to Reddit with the global fetch. Tests
// replace it with a mock, which the renderer project's
// unstubGlobals option removes after each test:
//
//   const fetch = stubFetch(jsonResponse({ name: 'u' }))
//   expect(fetch).toHaveBeenCalledOnce()

import {
  vi,
  type Mock
} from 'vitest'

export type FetchMock = Mock<typeof fetch>

// Answers each call with the next response in order, then
// fails, so an unexpected request can't reach the network
export function stubFetch(...responses: Response[]): FetchMock {
  const mock: FetchMock = vi.fn(() => {
    const next = responses.shift()

    return next
      ? Promise.resolve(next)
      : Promise.reject(new Error('Unexpected fetch call'))
  })

  vi.stubGlobal('fetch', mock)
  return mock
}

export function jsonResponse(
  body: unknown,
  init: ResponseInit = { }
): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init
  })
}
