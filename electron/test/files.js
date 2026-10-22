// The committed test files, and a fake fetch serving them the way
// v.redd.it does: in byte ranges, and 403 for anything else

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

// A fetch (for net.fetch's mockImplementation) answering each URL
// in files with its body: a string, or a Buffer served in ranges
export function serveFiles(files) {
  return (input, init) => {
    const request = new Request(input, init)
    const body = files[request.url]

    if (body === undefined)
      return Promise.resolve(new Response('', { status: 403 }))

    const range = /bytes=(\d+)-(\d*)/
      .exec(request.headers.get('range') ?? '')

    if (!range || typeof body === 'string')
      return Promise.resolve(new Response(body))

    const start = Number(range[1])
    const end = range[2]
      ? Math.min(Number(range[2]), body.length - 1)
      : body.length - 1

    const res = new Response(
      body.subarray(start, end + 1),
      {
        status: 206,
        headers: {
          'content-range': `bytes ${start}-${end}/${body.length}`,
          'content-length': String(end - start + 1)
        }
      }
    )
    return Promise.resolve(res)
  }
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
