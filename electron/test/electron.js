// A fake of the parts of Electron the main process uses. A
// new one is made for each test (see setup.js), with
// userData (and Downloads inside it) in a fresh temp
// directory

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

// The main process only asks for userData and downloads, so
// any other name is a bug
function getPath(name) {
  if (name === 'userData')
    return userData

  if (name === 'downloads')
    return path.join(userData, 'Downloads')

  throw new Error(`app.getPath('${name}') isn't faked`)
}

export function createElectron() {
  userData = fs.mkdtempSync(
    path.join(os.tmpdir(), 'tidder-test-'))
  fs.mkdirSync(getPath('downloads'))

  current = {
    app: {
      getPath: vi.fn(getPath),
      getVersion: vi.fn(() => '0.0.0-test')
    },

    BrowserWindow: {
      fromWebContents: vi.fn(() => null)
    },

    clipboard: {
      writeText: vi.fn()
    },

    // The user cancels, unless a test stubs it
    dialog: {
      showSaveDialog: vi.fn(() => Promise.resolve({
        canceled: true,
        filePath: ''
      }))
    },

    // Records the handlers, so a test can call them (see
    // ipcHandler())
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn()
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

// The handler registered for an IPC channel, with
// ipcMain.handle() or ipcMain.on()
export function ipcHandler(channel) {
  const { handle, on } = current.ipcMain
  const call = [...handle.mock.calls, ...on.mock.calls]
    .find(([name]) => name === channel)

  if (!call)
    throw new Error(`Nothing handles '${channel}'`)

  return call[1]
}

export function removeElectron() {
  if (userData)
    fs.rmSync(userData, { recursive: true, force: true })

  userData = null
  current = null
}
