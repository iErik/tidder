import {
  fireEvent,
  render,
  type RenderResult
} from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import type { Post } from 'api/types'

import PostCard from './PostCard'

// A Reddit video post with sound, named after `id`
function videoPost(id: string): Post {
  const base = `https://v.redd.it/${id}`

  return {
    id,
    name: `t3_${id}`,
    title: 'A video',
    author: 'someone',
    subreddit: 'videos',
    subreddit_name_prefixed: 'r/videos',
    permalink: `/r/videos/comments/${id}/a_video/`,
    url: base,
    domain: 'v.redd.it',
    score: 1,
    num_comments: 0,
    created_utc: 0,
    likes: null,
    saved: false,
    hidden: false,
    is_self: false,
    is_video: true,
    selftext_html: null,
    thumbnail: '',
    media: {
      reddit_video: {
        fallback_url: `${base}/CMAF_720.mp4?source=fallback`,
        hls_url: `${base}/HLSPlaylist.m3u8`,
        has_audio: true
      }
    },
    secure_media_embed: { }
  }
}

function renderCard(post: Post) {
  return render(
    <MemoryRouter>
      <PostCard post={post} onFeedAction={vi.fn()} />
    </MemoryRouter>
  )
}

function rerenderCard(result: RenderResult, post: Post) {
  result.rerender(
    <MemoryRouter>
      <PostCard post={post} onFeedAction={vi.fn()} />
    </MemoryRouter>
  )
}

function video(result: RenderResult): HTMLVideoElement {
  return result.container.querySelector('video')!
}

describe('PostCard video', () => {
  it('plays the HLS stream of a video with sound', () => {
    const result = renderCard(videoPost('abc'))

    expect(video(result).getAttribute('src'))
      .toBe('https://v.redd.it/abc/HLSPlaylist.m3u8')
  })

  it('falls back to fallback_url when the stream fails', () => {
    const result = renderCard(videoPost('abc'))

    fireEvent.error(video(result))

    expect(video(result).getAttribute('src'))
      .toBe('https://v.redd.it/abc/CMAF_720.mp4?source=fallback')
  })

  it('stays on fallback_url when that fails too', () => {
    const result = renderCard(videoPost('abc'))

    fireEvent.error(video(result))
    fireEvent.error(video(result))

    expect(video(result).getAttribute('src'))
      .toBe('https://v.redd.it/abc/CMAF_720.mp4?source=fallback')
  })

  it('tries the next post\'s stream after a failure', () => {
    const result = renderCard(videoPost('abc'))

    fireEvent.error(video(result))
    rerenderCard(result, videoPost('def'))

    expect(video(result).getAttribute('src'))
      .toBe('https://v.redd.it/def/HLSPlaylist.m3u8')
  })
})
