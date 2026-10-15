// A fake of the parts of Electron the main process uses. A
// new one is made for each test (see setup.js), with
// userData in a fresh temp directory

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { vi } from 'vitest'

let current = null

// The directory createElectron() made. Cleanup removes this,
// not whatever a test has stubbed getPath to return
let userData = null

// The fake the code under test gets from require('electron')
export function electron() {
  return current
}

// The main process only asks for userData, so any other name
// is a bug
function getPath(name) {
  if (name !== 'userData')
    throw new Error(`app.getPath('${name}') isn't faked`)

  return userData
}

export function createElectron() {
  userData = fs.mkdtempSync(
    path.join(os.tmpdir(), 'tidder-test-'))

  current = {
    app: {
      getPath: vi.fn(getPath),
      getVersion: vi.fn(() => '0.0.0-test')
    },

    // Rejects, like a failed request in Electron, unless a
    // test stubs it, so nothing reaches the network
    net: {
      fetch: vi.fn(() => Promise.reject(
        new Error('net.fetch is not stubbed')))
    },

    shell: {
      openExternal: vi.fn(() => Promise.resolve())
    },

    // Reversible, so tests can check what was stored
    safeStorage: {
      isEncryptionAvailable: vi.fn(() => true),
      encryptString: vi.fn(text =>
        Buffer.from(`encrypted:${text}`)),
      decryptString: vi.fn(buffer =>
        buffer.toString().replace(/^encrypted:/, ''))
    }
  }

  return current
}

export function removeElectron() {
  if (userData)
    fs.rmSync(userData, { recursive: true, force: true })

  userData = null
  current = null
}
