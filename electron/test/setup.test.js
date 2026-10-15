// Checks the main-process test setup itself: the fake
// Electron and the module cache

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'

import {
  describe,
  expect,
  it
} from 'vitest'

import { electron } from './electron.js'

const require = createRequire(import.meta.url)

describe('fake electron', () => {
  it('is what require() returns', () => {
    expect(require('electron')).toBe(electron())
  })

  it('keeps userData in a temp directory', () => {
    const userData = electron().app.getPath('userData')

    expect(userData.startsWith(os.tmpdir())).toBe(true)
    expect(fs.existsSync(userData)).toBe(true)
  })

  it("doesn't reach the network unless stubbed", () => {
    expect(() => electron().net.fetch('https://reddit.com'))
      .toThrow('not stubbed')
  })

  it('round-trips safeStorage', () => {
    const { safeStorage } = electron()
    const stored = safeStorage.encryptString('token')

    expect(stored.toString()).not.toBe('token')
    expect(safeStorage.decryptString(stored)).toBe('token')
  })
})

describe('module cache', () => {
  it('starts each test without the app modules', () => {
    const cached = Object.keys(require.cache)
      .filter(file => file.includes('/electron/')
        && !file.includes('/node_modules/'))

    expect(cached).toEqual([])
    require('../settings.js')
  })
})
