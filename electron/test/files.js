// The committed test files, and what's in them

import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)

// The *.mpd are DASH manifests. video.mp4 and audio.mp4 are tiny
// fragmented MP4s like the files Reddit serves, with one H.264
// video track and one AAC audio track. Their packets are
// placeholder bytes, since the remux copies packets without
// decoding them
export function fixturePath(name) {
  return path.join(import.meta.dirname, 'fixtures', name)
}

export function fixture(name) {
  return fs.readFileSync(fixturePath(name))
}

// The types of the tracks in the MP4 at file, sorted
export async function trackTypes(file) {
  const { ALL_FORMATS, FilePathSource, Input } = require('mediabunny')
  const input = new Input({
    source: new FilePathSource(file),
    formats: ALL_FORMATS
  })

  try {
    const tracks = await input.getTracks()
    return tracks.map(track => track.type).sort()
  } finally {
    input.dispose()
  }
}
