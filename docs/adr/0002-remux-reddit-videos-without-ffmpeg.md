# Remux Reddit videos with mediabunny, not ffmpeg

Reddit serves a Reddit video's picture and sound as separate MP4
files, so downloading one with sound means combining the two. We do
that in the main process with mediabunny, which copies the tracks
into one MP4 without re-encoding. It's pure JavaScript (MPL-2.0),
with no dependencies or install script.

## Considered options

- **Bundling ffmpeg (`ffmpeg-static`)**: rejected. The binary is
  46-83 MB per platform, which would roughly double the size of each
  release. The builds are GPL-3.0. Its install script downloads only
  the host platform's binary, which breaks packaging the other
  platforms and needs a pnpm `allowBuilds` approval.
- **mp4box.js**: BSD-3 and dependency-free, but it only offers
  low-level sample copying, so it means much more code for the same
  result.

## Consequences

Remuxing copies tracks and never transcodes. If Reddit ever serves
codecs that can't share an MP4 container, this decision has to be
revisited. Playback needs none of this: Chromium plays the HLS
stream, sound included, natively. Chromium's native HLS doesn't play
when the page is served from `http://localhost`, so under
`pnpm run dev` Reddit videos play silently from `fallback_url`.
