import {
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import {
  MemoryRouter,
  Route,
  Routes
} from 'react-router'

import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import type { Post } from 'api/types'

import { jsonResponse, stubFetch } from '../../test/fetch'

const post: Post = {
  id: 'abc',
  name: 't3_abc',
  title: 'A post',
  author: 'someone',
  subreddit: 'pics',
  subreddit_name_prefixed: 'r/pics',
  permalink: '/r/pics/comments/abc/a_post/',
  url: 'https://example.com/',
  domain: 'example.com',
  score: 1,
  num_comments: 0,
  created_utc: 0,
  likes: null,
  saved: false,
  hidden: false,
  is_self: false,
  is_video: false,
  selftext_html: null,
  thumbnail: 'https://example.com/thumb.jpg',
  media: null,
  secure_media_embed: { }
}

const open = { type: 'open', thing: post }

// Renders the card at /, with a page at /r/<sub> to show
// that the subreddit link navigated. Voting writes
// thingState and right-clicking the context menu store, so
// each test loads fresh copies.
async function renderCard() {
  vi.resetModules()
  const { default: PostFeedCard } =
    await import('components/PostFeedCard/PostFeedCard')
  const { getContextMenu } = await import('core/contextMenu')

  const onFeedAction = vi.fn()
  const card = (
    <PostFeedCard post={post} onFeedAction={onFeedAction} />
  )
  const result = render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={card} />
        <Route path="/r/:sub" element={<p>Subreddit page</p>} />
      </Routes>
    </MemoryRouter>
  )

  return { result, onFeedAction, getContextMenu }
}

afterEach(() => {
  window.getSelection()?.removeAllRanges()
})

describe('PostFeedCard', () => {
  it('opens the post from the author name', async () => {
    const { onFeedAction } = await renderCard()

    fireEvent.click(screen.getByText('someone'))

    expect(onFeedAction).toHaveBeenCalledOnce()
    expect(onFeedAction).toHaveBeenCalledWith(open)
  })

  it('opens the post from the thumbnail', async () => {
    const { result, onFeedAction } = await renderCard()
    const thumbnail = result.container.querySelector(
      '.post-thumbnail'
    )!

    fireEvent.click(thumbnail)

    expect(onFeedAction).toHaveBeenCalledOnce()
    expect(onFeedAction).toHaveBeenCalledWith(open)
  })

  it('opens the post once from the title', async () => {
    const { onFeedAction } = await renderCard()

    fireEvent.click(screen.getByText('A post'))

    expect(onFeedAction).toHaveBeenCalledOnce()
    expect(onFeedAction).toHaveBeenCalledWith(open)
  })

  it('votes without opening the post', async () => {
    const { onFeedAction } = await renderCard()
    const fetch = stubFetch(
      jsonResponse({ }),
      jsonResponse({ })
    )
    const upvote = screen.getByRole(
      'button',
      { name: 'Upvote' }
    )
    const downvote = screen.getByRole(
      'button',
      { name: 'Downvote' }
    )

    fireEvent.click(upvote)
    expect(upvote.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(downvote)
    expect(downvote.getAttribute('aria-pressed')).toBe('true')

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    expect(onFeedAction).not.toHaveBeenCalled()
  })

  it('follows the subreddit link without opening', async () => {
    const { onFeedAction } = await renderCard()

    fireEvent.click(screen.getByText('pics'))

    expect(screen.getByText('Subreddit page')).toBeTruthy()
    expect(onFeedAction).not.toHaveBeenCalled()
  })

  it('leaves the post closed after a selection', async () => {
    const { onFeedAction } = await renderCard()
    const author = screen.getByText('someone')
    const range = document.createRange()
    range.selectNodeContents(author)
    window.getSelection()!.addRange(range)

    fireEvent.click(author)

    expect(onFeedAction).not.toHaveBeenCalled()
  })

  it('opens the menu, not the post, on right-click', async () => {
    const { onFeedAction, getContextMenu } = await renderCard()

    fireEvent.contextMenu(screen.getByText('someone'))

    expect(getContextMenu()).not.toBeNull()
    expect(onFeedAction).not.toHaveBeenCalled()
  })
})
