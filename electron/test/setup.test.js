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

describe('fake electron', () => {
  it('is what require() returns', () => {
    expect(require('electron')).toBe(electron())
  })

  it('keeps userData in a temp directory', () => {
    const userData = electron().app.getPath('userData')

    expect(userData.startsWith(os.tmpdir())).toBe(true)
    expect(fs.existsSync(userData)).toBe(true)
  })

  it('only fakes the userData path', () => {
    expect(() => electron().app.getPath('home'))
      .toThrow('isn\'t faked')
  })

  it('removes its own directory when getPath is stubbed', () => {
    const created = electron().app.getPath('userData')
    const other = fs.mkdtempSync(
      path.join(os.tmpdir(), 'tidder-other-'))

    electron().app.getPath.mockReturnValue(other)
    removeElectron()

    expect(fs.existsSync(created)).toBe(false)
    expect(fs.existsSync(other)).toBe(true)
    fs.rmSync(other, { recursive: true, force: true })
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

// These two run in order: the second checks what the first
// left in the cache
describe('module cache', () => {
  it('loads the app modules through the fake', () => {
    const settings = require('../settings.js')
    settings.load()

    expect(electron().app.getPath)
      .toHaveBeenCalledWith('userData')
    expect(Object.keys(require.cache).some(ownElectronFile))
      .toBe(true)
  })

  it('drops the app modules the last test loaded', () => {
    expect(Object.keys(require.cache).filter(ownElectronFile))
      .toEqual([])
  })
})
