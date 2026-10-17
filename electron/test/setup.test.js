// Checks the main-process test setup itself: the fake
// Electron and the module cache

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

import {
  describe,
  expect,
  it
} from 'vitest'

import {
  electron,
  removeElectron
} from './electron.js'

const require = createRequire(import.meta.url)

// The project's own main-process files in the module cache
const ownElectronFile = file =>
  file.includes(`${path.sep}electron${path.sep}`)
    && !file.includes(`${path.sep}node_modules${path.sep}`)

describe('fake electron', { concurrent: false }, () => {
  it('is what require() returns', () => {
    expect(require('electron')).toBe(electron())
  })

  it('keeps userData in a temp directory', () => {
    const userData = electron().app.getPath('userData')

    expect(userData.startsWith(os.tmpdir())).toBe(true)
    expect(fs.existsSync(userData)).toBe(true)
  })

  it('keeps Downloads inside userData', () => {
    const { getPath } = electron().app
    const downloads = getPath('downloads')

    expect(path.dirname(downloads)).toBe(getPath('userData'))
    expect(fs.existsSync(downloads)).toBe(true)
  })

  it('only fakes the userData and downloads paths', () => {
    expect(() => electron().app.getPath('home'))
      .toThrow('isn\'t faked')
  })

  it('removes its own directory when getPath is stubbed', () => {
    const created = electron().app.getPath('userData')
    const other = fs.mkdtempSync(
      path.join(os.tmpdir(), 'tidder-other-'))

    try {
      electron().app.getPath.mockReturnValue(other)
      removeElectron()

      expect(fs.existsSync(created)).toBe(false)
      expect(fs.existsSync(other)).toBe(true)
    } finally {
      fs.rmSync(other, { recursive: true, force: true })
    }
  })

  it("doesn't reach the network unless stubbed", async () => {
    await expect(electron().net.fetch('https://reddit.com'))
      .rejects.toThrow('not stubbed')
  })

  it('round-trips safeStorage', () => {
    const { safeStorage } = electron()
    const stored = safeStorage.encryptString('token')

    expect(stored.toString()).not.toBe('token')
    expect(safeStorage.decryptString(stored)).toBe('token')
  })
})

// The second test checks what the first left in the cache,
// so they run in order, unshuffled, and the second fails
// unless the first ran just before it (an empty cache alone
// proves nothing: run them together, not one at a time)
describe('module cache', {
  concurrent: false,
  shuffle: false
}, () => {
  let loaded = false

  it('loads the app modules through the fake', () => {
    const settings = require('../settings.js')
    // In the cache from here on, even if the checks fail
    loaded = true
    settings.load()

    expect(electron().app.getPath)
      .toHaveBeenCalledWith('userData')
    expect(Object.keys(require.cache).some(ownElectronFile))
      .toBe(true)
  })

  it('drops the app modules the last test loaded', () => {
    expect(loaded, 'the test before this one has to run first')
      .toBe(true)
    expect(Object.keys(require.cache).filter(ownElectronFile))
      .toEqual([])
  })
})
