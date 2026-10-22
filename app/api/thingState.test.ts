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
  hidden: boolean
}

function post(patch: Partial<Post> = { }): Post {
  return {
    name: 't3_abc',
    title: 'A post',
    likes: null,
    saved: false,
    hidden: false,
    ...patch
  }
}

interface PendingRequest {
  path: string
  body: URLSearchParams
  answer: (response: Response) => void
}

// Requests that only answer when the test says so, in the
// order they were sent
function pendingFetch(): PendingRequest[] {
  const requests: PendingRequest[] = []

  vi.stubGlobal('fetch', vi.fn((url: URL, init?: RequestInit) =>
    new Promise<Response>((answer) => {
      requests.push({
        path: url.pathname,
        body: init?.body as URLSearchParams,
        answer
      })
    })))
  return requests
}

// Answers a request, and lets thingState handle the response
// and send whatever comes next
async function answer(request: PendingRequest, response: Response) {
  request.answer(response)
  await act(() => new Promise((done) => setTimeout(done, 0)))
}

const dirs = (requests: PendingRequest[]) =>
  requests.map((request) => request.body.get('dir'))

const failure = () => jsonResponse({ }, { status: 500 })

function render(state: ThingState, thing: Post) {
  return renderHook(() => state.useThing(thing))
}

// Starts a write inside act(), since it updates the store
function start<R>(write: () => Promise<R>): Promise<R> {
  const promises: Promise<R>[] = []
  act(() => { promises.push(write()) })
  return promises[0]
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
    const requests = pendingFetch()
    const { result } = render(state, post())

    let request: Promise<boolean> | undefined
    act(() => { request = state.voteThing(post(), 1) })
    expect(result.current.likes).toBe(true)

    requests[0].answer(jsonResponse({ }))
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

  it('resolve to whether Reddit accepted them', async () => {
    const state = await loadThingState()
    stubFetch(jsonResponse({ }), failure())

    expect(await state.saveThing(post(), true)).toBe(true)
    expect(await state.saveThing(post(), false)).toBe(false)
  })
})

describe('hideThing', () => {
  it('hides the post before Reddit answers', async () => {
    const state = await loadThingState()
    const requests = pendingFetch()
    const { result } = render(state, post())

    let request: Promise<boolean> | undefined
    act(() => { request = state.hideThing(post(), true) })
    expect(result.current.hidden).toBe(true)

    requests[0].answer(jsonResponse({ }))
    expect(await act(() => request)).toBe(true)
    expect(result.current.hidden).toBe(true)
  })

  it('brings the post back when Reddit refuses', async () => {
    const state = await loadThingState()
    stubFetch(failure())
    const { result } = render(state, post())

    expect(await act(() => state.hideThing(post(), true))).toBe(false)
    expect(result.current.hidden).toBe(false)
  })

  it('keeps Reddit\'s hidden field until changed', async () => {
    const state = await loadThingState()
    const { result } = render(state, post({ hidden: true }))

    expect(result.current.hidden).toBe(true)
  })

  it('unhides a post Reddit sent as hidden', async () => {
    const state = await loadThingState()
    stubFetch(jsonResponse({ }))
    const thing = post({ hidden: true })
    const { result } = render(state, thing)

    const accepted = await act(() => state.hideThing(thing, false))

    expect(accepted).toBe(true)
    expect(result.current.hidden).toBe(false)
  })

  it('hides it again when Reddit refuses to unhide', async () => {
    const state = await loadThingState()
    stubFetch(failure())
    const thing = post({ hidden: true })
    const { result } = render(state, thing)

    const accepted = await act(() => state.hideThing(thing, false))

    expect(accepted).toBe(false)
    expect(result.current.hidden).toBe(true)
  })

  it('sends the hide and unhide requests', async () => {
    const state = await loadThingState()
    const fetch = stubFetch(jsonResponse({ }), jsonResponse({ }))

    await state.hideThing(post(), true)
    await state.hideThing(post(), false)

    const paths = fetch.mock.calls.map(([url]) => (url as URL).pathname)
    expect(paths).toEqual(['/api/hide', '/api/unhide'])
    const body = fetch.mock.calls[0][1]?.body as URLSearchParams
    expect(body.get('id')).toBe('t3_abc')
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
    const requests = pendingFetch()
    const { result } = render(state, post())

    let request: Promise<void> | undefined
    act(() => { request = state.reportThing(post(), reason) })
    expect(result.current).not.toHaveProperty('reported')

    requests[0].answer(jsonResponse({ json: { errors: [] } }))
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

describe('overlapping writes to a field', () => {
  it('send one request at a time, in order', async () => {
    const state = await loadThingState()
    const requests = pendingFetch()
    const { result } = render(state, post())

    const up = start(() => state.voteThing(post(), 1))
    const down = start(() => state.voteThing(post(), -1))
    expect(result.current.likes).toBe(false)
    expect(dirs(requests)).toEqual(['1'])

    await answer(requests[0], jsonResponse({ }))
    expect(dirs(requests)).toEqual(['1', '-1'])

    await answer(requests[1], jsonResponse({ }))
    expect(await up).toBe(true)
    expect(await down).toBe(true)
    expect(result.current.likes).toBe(false)
  })

  it('send only the latest of the waiting writes', async () => {
    const state = await loadThingState()
    const requests = pendingFetch()

    void start(() => state.voteThing(post(), 1))
    void start(() => state.voteThing(post(), -1))
    void start(() => state.voteThing(post(), 0))

    await answer(requests[0], jsonResponse({ }))
    await answer(requests[1], jsonResponse({ }))
    expect(dirs(requests)).toEqual(['1', '0'])
  })

  it('settle a replaced write with the write that replaced it',
    async () => {
      const state = await loadThingState()
      const requests = pendingFetch()
      const { result } = render(state, post())

      const up = start(() => state.voteThing(post(), 1))
      const down = start(() => state.voteThing(post(), -1))
      const none = start(() => state.voteThing(post(), 0))

      await answer(requests[0], jsonResponse({ }))
      await answer(requests[1], failure())

      expect(await up).toBe(true)
      expect(await down).toBe(false)
      expect(await none).toBe(false)
      // Back to the upvote, which Reddit accepted
      expect(result.current.likes).toBe(true)
    })

  it('keep showing a newer write when an earlier one fails',
    async () => {
      const state = await loadThingState()
      const requests = pendingFetch()
      const { result } = render(state, post())

      const up = start(() => state.voteThing(post(), 1))
      const down = start(() => state.voteThing(post(), -1))

      await answer(requests[0], failure())
      expect(result.current.likes).toBe(false)
      expect(dirs(requests)).toEqual(['1', '-1'])
      expect(console.error).toHaveBeenCalled()

      await answer(requests[1], jsonResponse({ }))
      expect(await up).toBe(false)
      expect(await down).toBe(true)
      expect(result.current.likes).toBe(false)
    })

  it('revert to Reddit\'s value when every write fails',
    async () => {
      const state = await loadThingState()
      const requests = pendingFetch()
      const thing = post({ saved: true })
      const { result } = render(state, thing)

      void start(() => state.saveThing(thing, false))
      void start(() => state.saveThing(thing, true))
      const last = start(() => state.saveThing(thing, false))

      await answer(requests[0], failure())
      expect(result.current.saved).toBe(false)

      await answer(requests[1], failure())
      expect(await last).toBe(false)
      expect(result.current.saved).toBe(true)
    })

  it('skip a waiting write that matches Reddit\'s value',
    async () => {
      const state = await loadThingState()
      const requests = pendingFetch()
      const { result } = render(state, post())

      const up = start(() => state.voteThing(post(), 1))
      const none = start(() => state.voteThing(post(), 0))

      await answer(requests[0], failure())

      expect(await up).toBe(false)
      expect(await none).toBe(true)
      expect(requests).toHaveLength(1)
      expect(result.current.likes).toBeNull()
    })

  it('don\'t hold up other fields or other things', async () => {
    const state = await loadThingState()
    const requests = pendingFetch()

    void start(() => state.voteThing(post(), 1))
    void start(() => state.saveThing(post(), true))
    void start(() => state.voteThing(post({ name: 't3_def' }), 1))
    void start(() => state.voteThing(post(), -1))

    expect(requests.map((request) => [
      request.path,
      request.body.get('id')
    ])).toEqual([
      ['/api/vote', 't3_abc'],
      ['/api/save', 't3_abc'],
      ['/api/vote', 't3_def']
    ])
  })

  it('invalidate the subscriptions once settled', async () => {
    const state = await loadThingState()
    const { queryClient } = await import('core/queryClient')
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const requests = pendingFetch()
    const sub = { name: 't5_abc', user_is_subscriber: false }

    const subscribed = start(() => state.setSubscribed(sub, true))
    expect(invalidate).not.toHaveBeenCalled()

    await answer(requests[0], jsonResponse({ }))
    await subscribed
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['subscriptions']
    })
  })
})

describe('clearThingChanges', () => {
  it('drops the waiting writes', async () => {
    const state = await loadThingState()
    const requests = pendingFetch()
    const thing = post()
    const { result } = render(state, thing)

    const up = start(() => state.voteThing(thing, 1))
    const down = start(() => state.voteThing(thing, -1))
    act(() => state.clearThingChanges())

    expect(await down).toBe(false)
    expect(result.current).toBe(thing)

    await answer(requests[0], jsonResponse({ }))
    expect(await up).toBe(true)
    expect(requests).toHaveLength(1)
    expect(result.current).toBe(thing)
  })

  it('ignores a late failure', async () => {
    const state = await loadThingState()
    const requests = pendingFetch()
    const thing = post()
    const { result } = render(state, thing)

    const up = start(() => state.voteThing(thing, 1))
    act(() => state.clearThingChanges())

    await answer(requests[0], failure())
    expect(await up).toBe(false)
    expect(result.current).toBe(thing)
  })
})
