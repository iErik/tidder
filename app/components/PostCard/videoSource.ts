import type { Post } from 'api/types'

type VideoPost = Pick<Post, 'is_video' | 'media' | 'preview'>

// The URL of a video's file: a Reddit video's picture-only
// fallback_url, or a video preview's mp4
export function videoFileUrl(post: VideoPost): string | undefined {
  if (post.is_video)
    return post.media?.reddit_video?.fallback_url

  return post.preview?.images[0]?.variants['mp4']?.source.url
}

// A Reddit video's HLS stream, which Chromium plays natively,
// sound included. Only for videos with sound.
function hlsSource(post: VideoPost): string | undefined {
  const video = post.is_video ? post.media?.reddit_video : undefined

  return video?.has_audio ? video.hls_url : undefined
}

// What the post viewer plays: a Reddit video with sound plays
// its HLS stream, unless `failed` says that stream failed.
// Everything else plays its file.
export function videoSource(
  post: VideoPost,
  failed: string | null = null
): string | undefined {
  const hls = hlsSource(post)

  return hls && hls !== failed ? hls : videoFileUrl(post)
}

// The `failed` state after the playing source fails. A failed
// HLS stream is marked, so the viewer falls back to the file,
// once: native HLS doesn't play from http://localhost, as in
// `pnpm run dev`. A failing file leaves the state as it is, so
// it can't loop.
export function failSource(
  post: VideoPost,
  failed: string | null
): string | null {
  return hlsSource(post) ?? failed
}
