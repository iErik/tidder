// A fake of the parts of Electron the main process uses. A
// new one is made for each test (see setup.js), with
// userData in a fresh temp directory

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { vi } from 'vitest'

let current = null

// The fake the code under test gets from require('electron')
export function electron() {
  return current
}

export function createElectron() {
  const userData = fs.mkdtempSync(
    path.join(os.tmpdir(), 'tidder-test-'))

  current = {
    app: {
      getPath: vi.fn(() => userData),
      getVersion: vi.fn(() => '0.0.0-test')
    },

    // Fails the test unless a test stubs it, so nothing
    // reaches the network
    net: {
      fetch: vi.fn(() => {
        throw new Error('net.fetch is not stubbed')
      })
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
  if (!current) return

  fs.rmSync(current.app.getPath('userData'), {
    recursive: true,
    force: true
  })
  current = null
}
