import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import {
  describe,
  expect,
  it
} from 'vitest'

import { electron } from './test/electron.js'
import {
  fixturePath,
  trackTypes
} from './test/files.js'

const require = createRequire(import.meta.url)

function source(name) {
  const { FilePathSource } = require('mediabunny')
  return new FilePathSource(fixturePath(name))
}

// Remuxes the two fixtures into a new file, and returns its path
async function remuxInto(videoName, audioName) {
  const { remux } = require('./remux.js')
  const file = path.join(electron().app.getPath('downloads'), 'out.mp4')
  const handle = await fs.promises.open(file, 'w')

  try {
    await remux(source(videoName), source(audioName), handle)
  } finally {
    await handle.close()
  }

  return file
}

describe('remux', { concurrent: false }, () => {
  it('writes one MP4 with a video and an audio track', async () => {
    const file = await remuxInto('video.mp4', 'audio.mp4')

    expect(await trackTypes(file)).toEqual(['audio', 'video'])
  })

  it('rejects when the audio file has no audio track', async () => {
    await expect(remuxInto('video.mp4', 'video.mp4'))
      .rejects.toThrow('A video and an audio track are needed')
  })
})
