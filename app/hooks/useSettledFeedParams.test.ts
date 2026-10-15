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
  FeedProvider,
  useFeedState
} from 'pages/FeedPage/FeedContext'

import {
  useSettledFeedParams
} from './useSettledFeedParams'

const DELAY = 300

// The settled params, and the feed state to change them with
function render() {
  const { result } = renderHook(() => ({
    params: useSettledFeedParams(),
    feed: useFeedState()
  }), { wrapper: FeedProvider })

  return result
}

function wait(ms: number) {
  act(() => { vi.advanceTimersByTime(ms) })
}

describe('useSettledFeedParams', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with the feed state', () => {
    expect(render().current.params)
      .toEqual({ source: '', sort: 'hot', query: '' })
  })

  it('applies a search once it settles', () => {
    const result = render()

    act(() => result.current.feed.setSearchQuery('cats'))
    wait(DELAY - 1)
    expect(result.current.params.query).toBe('')

    wait(1)
    expect(result.current.params)
      .toEqual({ source: '', sort: 'relevance', query: 'cats' })
  })

  it('waits for typing to pause', () => {
    const result = render()

    act(() => result.current.feed.setSearchQuery('c'))
    wait(DELAY - 100)
    act(() => result.current.feed.setSearchQuery('ca'))
    wait(DELAY - 100)
    expect(result.current.params.query).toBe('')

    wait(100)
    expect(result.current.params.query).toBe('ca')
  })

  it('applies a sort change once it settles', () => {
    const result = render()

    act(() => result.current.feed.setSortMode('new'))
    wait(DELAY - 1)
    expect(result.current.params.sort).toBe('hot')

    wait(1)
    expect(result.current.params.sort).toBe('new')
  })

  it('applies a new source at once', () => {
    const result = render()

    act(() => result.current.feed.setSource('r/pics', false))

    expect(result.current.params)
      .toEqual({ source: 'r/pics', sort: 'hot', query: '' })
  })

  it('applies a new source with a pending search', () => {
    const result = render()

    act(() => result.current.feed.setSearchQuery('cats'))
    act(() => result.current.feed.setSource('r/pics', false))

    expect(result.current.params).toEqual({
      source: 'r/pics',
      sort: 'relevance',
      query: 'cats'
    })
  })
})
