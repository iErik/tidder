import { createRequire } from 'node:module'

import {
  describe,
  expect,
  it
} from 'vitest'

import { fixture } from './test/files.js'

const require = createRequire(import.meta.url)

// Reddit's manifest URLs have a query, which the files' don't
const MANIFEST_URL = 'https://v.redd.it/abc123/DASHPlaylist.mpd?a=1&v=1'
const BASE = 'https://v.redd.it/abc123'

function parse(xml) {
  const { parseDashManifest } = require('./dashManifest.js')
  return parseDashManifest(xml, MANIFEST_URL)
}

describe('parseDashManifest', () => {
  // Real manifests, cut down to a few Representations, the
  // best never listed first. no-audio.mpd is cmaf.mpd without
  // its audio AdaptationSet
  it.each([
    ['the current CMAF_ layout', 'cmaf.mpd', {
      video: `${BASE}/CMAF_480.mp4`,
      audio: `${BASE}/CMAF_AUDIO_128.mp4`
    }],
    ['the older DASH_AUDIO_128 layout', 'dash-audio-128.mpd', {
      video: `${BASE}/DASH_480.mp4`,
      audio: `${BASE}/DASH_AUDIO_128.mp4`
    }],
    ['the old bare-audio layout', 'bare-audio.mpd', {
      video: `${BASE}/DASH_2_4_M`,
      audio: `${BASE}/audio`
    }],
    ['a video without sound', 'no-audio.mpd', {
      video: `${BASE}/CMAF_480.mp4`,
      audio: null
    }]
  ])('picks the best files of %s', (_, name, expected) => {
    expect(parse(fixture(name).toString())).toEqual(expected)
  })

  it('resolves absolute and escaped BaseURLs', () => {
    const xml = `
      <AdaptationSet contentType="video">
        <Representation bandwidth="1" mimeType="video/mp4">
          <BaseURL>https://cdn.example/v.mp4?a=1&amp;b=2</BaseURL>
        </Representation>
      </AdaptationSet>`

    expect(parse(xml).video).toBe('https://cdn.example/v.mp4?a=1&b=2')
  })

  it('skips Representations without a BaseURL', () => {
    const xml = `
      <AdaptationSet mimeType="video/mp4">
        <Representation bandwidth="9" />
        <Representation bandwidth="1"><BaseURL>v.mp4</BaseURL>
        </Representation>
      </AdaptationSet>`

    expect(parse(xml).video).toBe(`${BASE}/v.mp4`)
  })

  it('throws for a manifest without video', () => {
    expect(() => parse('Access denied')).toThrow('no video')
  })
})
