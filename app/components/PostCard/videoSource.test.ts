import {
  describe,
  expect,
  it
} from 'vitest'

import type { Post, RedditVideo } from 'api/types'

import { videoFileUrl, videoSource } from './videoSource'

const BASE = 'https://v.redd.it/abc123'
const HLS = `${BASE}/HLSPlaylist.m3u8`
const FALLBACK = `${BASE}/CMAF_720.mp4?source=fallback`
const PREVIEW_MP4 = 'https://preview.redd.it/cat.gif?format=mp4&s=x'

function redditVideo(video: Partial<RedditVideo> = {}) {
  return {
    is_video: true,
    media: {
      reddit_video: {
        fallback_url: FALLBACK,
        hls_url: HLS,
        dash_url: `${BASE}/DASHPlaylist.mpd`,
        has_audio: true,
        ...video
      }
    },
    preview: undefined
  } satisfies Pick<Post, 'is_video' | 'media' | 'preview'>
}

const videoPreview = {
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
    expect(videoSource(redditVideo())).toBe(HLS)
  })

  it('falls back to fallback_url when there is no hls_url', () => {
    const post = redditVideo({ hls_url: undefined })

    expect(videoSource(post)).toBe(FALLBACK)
  })

  it('plays a Reddit video without sound from fallback_url', () => {
    const post = redditVideo({ has_audio: false })

    expect(videoSource(post)).toBe(FALLBACK)
  })

  it('plays a video preview from its mp4', () => {
    expect(videoSource(videoPreview)).toBe(PREVIEW_MP4)
  })
})

describe('videoFileUrl', () => {
  it('gives a Reddit video\'s fallback_url, even with sound', () => {
    expect(videoFileUrl(redditVideo())).toBe(FALLBACK)
  })

  it('gives a video preview\'s mp4', () => {
    expect(videoFileUrl(videoPreview)).toBe(PREVIEW_MP4)
  })
})
