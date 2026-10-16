import {
  act,
  renderHook
} from '@testing-library/react'

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  jsonResponse,
  stubFetch
} from '../test/fetch'

// thingState keeps the user's changes at module level
async function loadThingState() {
  vi.resetModules()
  return import('api/thingState')
}

type ThingState = Awaited<ReturnType<typeof loadThingState>>

interface Post {
  name: string
  title: string
  likes: boolean | null
  saved: boolean
}

function post(patch: Partial<Post> = { }): Post {
  return {
    name: 't3_abc',
    title: 'A post',
    likes: null,
    saved: false,
    ...patch
  }
}

// A request that only answers when the test says so
function pendingFetch() {
  let resolve: (response: Response) => void = () => { }
  const promise = new Promise<Response>((done) => {
    resolve = done
  })

  vi.stubGlobal('fetch', vi.fn(() => promise))
  return resolve
}

const failure = () => jsonResponse({ }, { status: 500 })

function render(state: ThingState, thing: Post) {
  return renderHook(() => state.useThing(thing))
}

beforeEach(() => {
  // A failed request is logged
  vi.spyOn(console, 'error').mockImplementation(() => { })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('optimistic changes', () => {
  it('apply before Reddit answers', async () => {
    const state = await loadThingState()
    const answer = pendingFetch()
    const { result } = render(state, post())

    let request: Promise<void> | undefined
    act(() => { request = state.voteThing(post(), 1) })
    expect(result.current.likes).toBe(true)

    answer(jsonResponse({ }))
    await act(() => request)
    expect(result.current.likes).toBe(true)
  })

  it('revert to Reddit\'s value when the request fails',
    async () => {
      const state = await loadThingState()
      stubFetch(failure())
      const thing = post({ likes: false })
      const { result } = render(state, thing)

      await act(() => state.voteThing(thing, 1))

      expect(result.current.likes).toBe(false)
      expect(console.error).toHaveBeenCalled()
    })

  it('revert to the previous change when the request fails',
    async () => {
      const state = await loadThingState()
      stubFetch(jsonResponse({ }), failure())
      const { result } = render(state, post())

      await act(() => state.saveThing(post(), true))
      await act(() => state.saveThing(post(), false))

      expect(result.current.saved).toBe(true)
    })

  it('send the matching request', async () => {
    const state = await loadThingState()
    const fetch = stubFetch(jsonResponse({ }))
    const thing = post()

    await state.voteThing(thing, -1)

    const [url, init] = fetch.mock.calls[0]
    expect(url).toBeInstanceOf(URL)
    expect((url as URL).pathname).toBe('/api/vote')
    expect(Object.fromEntries(init?.body as URLSearchParams))
      .toMatchObject({ id: thing.name, dir: '-1' })
  })
})

describe('useThing', () => {
  it('returns the thing itself without changes', async () => {
    const state = await loadThingState()
    const thing = post()

    expect(render(state, thing).result.current).toBe(thing)
  })

  it('merges the changes over Reddit\'s data', async () => {
    const state = await loadThingState()
    stubFetch(jsonResponse({ }))
    const { result } = render(state, post({ likes: true }))

    await act(() => state.saveThing(post(), true))

    expect(result.current).toEqual(post({
      likes: true,
      saved: true
    }))
  })

  it('keeps every copy of a thing in step', async () => {
    const state = await loadThingState()
    stubFetch(jsonResponse({ }))
    const card = render(state, post())
    const viewer = render(state, { ...post(), title: 'Copy' })

    await act(() => state.voteThing(post(), 1))

    expect(card.result.current.likes).toBe(true)
    expect(viewer.result.current).toMatchObject({
      likes: true,
      title: 'Copy'
    })
  })
})

describe('reportThing', () => {
  const reason = { site_reason: 'spam' }

  it('marks the thing only once Reddit accepts', async () => {
    const state = await loadThingState()
    const answer = pendingFetch()
    const { result } = render(state, post())

    let request: Promise<void> | undefined
    act(() => { request = state.reportThing(post(), reason) })
    expect(result.current).not.toHaveProperty('reported')

    answer(jsonResponse({ json: { errors: [] } }))
    await act(() => request)
    expect(result.current).toHaveProperty('reported', true)
  })

  it('passes Reddit\'s errors on without marking it',
    async () => {
      const state = await loadThingState()
      stubFetch(jsonResponse({
        json: { errors: [['SUBREDDIT_REQUIRED', 'Nope']] }
      }))
      const { result } = render(state, post())

      await act(() => expect(state.reportThing(post(), reason))
        .rejects.toThrow('Nope'))

      expect(result.current).not.toHaveProperty('reported')
    })
})
