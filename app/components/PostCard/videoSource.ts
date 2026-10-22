import type { Post } from 'api/types'

type VideoPost = Pick<Post, 'is_video' | 'media' | 'preview'>

// The URL of a video's file: a Reddit video's picture-only
// fallback_url, or a video preview's mp4
export function videoFileUrl(post: VideoPost): string | undefined {
  if (post.is_video)
    return post.media?.reddit_video?.fallback_url

  return post.preview?.images[0]?.variants['mp4']?.source.url
}

// What the post viewer plays. A Reddit video with sound plays
// its HLS stream, which Chromium plays natively, sound
// included. Everything else plays its file.
export function videoSource(post: VideoPost): string | undefined {
  const video = post.is_video ? post.media?.reddit_video : undefined

  if (video?.has_audio && video.hls_url)
    return video.hls_url

  return videoFileUrl(post)
}

// The DASH manifest a download of a Reddit video with sound
// reads its video and audio files from. Everything else
// downloads its file.
export function videoDashUrl(post: VideoPost): string | undefined {
  const video = post.is_video ? post.media?.reddit_video : undefined

  return video?.has_audio ? video.dash_url : undefined
}
