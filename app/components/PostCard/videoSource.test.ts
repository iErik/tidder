import {
  describe,
  expect,
  it
} from 'vitest'

import type { Post, RedditVideo } from 'api/types'

import {
  failSource,
  videoFileUrl,
  videoSource
} from './videoSource'

const BASE = 'https://v.redd.it/abc123'
const HLS = `${BASE}/HLSPlaylist.m3u8`
const FALLBACK = `${BASE}/CMAF_720.mp4?source=fallback`
const PREVIEW_MP4 = 'https://preview.redd.it/cat.gif?format=mp4&s=x'

// A Reddit video post, with sound unless `video` says otherwise
function videoPost(video: Partial<RedditVideo> = {}) {
  return {
    is_video: true,
    media: {
      reddit_video: {
        fallback_url: FALLBACK,
        hls_url: HLS,
        has_audio: true,
        ...video
      }
    },
    preview: undefined
  } satisfies Pick<Post, 'is_video' | 'media' | 'preview'>
}

const previewPost = {
  is_video: false,
  media: null,
  preview: {
    images: [{
      source: { url: 'https://preview.redd.it/cat.gif' },
      variants: { mp4: { source: { url: PREVIEW_MP4 } } }
    }]
  }
} satisfies Pick<Post, 'is_video' | 'media' | 'preview'>

describe('videoSource', () => {
  it('plays a Reddit video with sound from its HLS stream', () => {
    expect(videoSource(videoPost())).toBe(HLS)
  })

  it('falls back to fallback_url when there is no hls_url', () => {
    const post = videoPost({ hls_url: undefined })

    expect(videoSource(post)).toBe(FALLBACK)
  })

  it('plays a Reddit video without sound from fallback_url', () => {
    const post = videoPost({ has_audio: false })

    expect(videoSource(post)).toBe(FALLBACK)
  })

  it('plays a video preview from its mp4', () => {
    expect(videoSource(previewPost)).toBe(PREVIEW_MP4)
  })

  it('plays fallback_url once the HLS stream failed', () => {
    expect(videoSource(videoPost(), HLS)).toBe(FALLBACK)
  })

  it('ignores a failure of another post\'s stream', () => {
    const failed = 'https://v.redd.it/other/HLSPlaylist.m3u8'

    expect(videoSource(videoPost(), failed)).toBe(HLS)
  })
})

describe('failSource', () => {
  it('marks a failed HLS stream, so fallback_url plays', () => {
    const post = videoPost()
    const failed = failSource(post, null)

    expect(failed).toBe(HLS)
    expect(videoSource(post, failed)).toBe(FALLBACK)
  })

  it('stays on fallback_url when that fails too', () => {
    const post = videoPost()
    const failed = failSource(post, failSource(post, null))

    expect(failed).toBe(HLS)
    expect(videoSource(post, failed)).toBe(FALLBACK)
  })

  it('changes nothing when a file fails', () => {
    expect(failSource(videoPost({ has_audio: false }), null))
      .toBeNull()
    expect(failSource(previewPost, null)).toBeNull()
  })
})

describe('videoFileUrl', () => {
  it('gives a Reddit video\'s fallback_url, even with sound', () => {
    expect(videoFileUrl(videoPost())).toBe(FALLBACK)
  })

  it('gives a video preview\'s mp4', () => {
    expect(videoFileUrl(previewPost)).toBe(PREVIEW_MP4)
  })
})
