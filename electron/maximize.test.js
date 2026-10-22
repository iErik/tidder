import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'

import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  electron,
  ipcHandler
} from './test/electron.js'

const require = createRequire(import.meta.url)

function loadMaximize() {
  return require('./maximize.js')
}

// A window that is maximized or not, and emits the events
// a real one does when that changes
function fakeWindow(maximized) {
  const win = new EventEmitter()

  win.isMaximized = vi.fn(() => maximized)
  win.maximize = vi.fn()
  win.unmaximize = vi.fn()
  win.webContents = { send: vi.fn() }

  return win
}

// An IPC event from win's page, which the fake's
// BrowserWindow.fromWebContents() maps back to win
function ipcEvent(win) {
  const fromWebContents = (sender) =>
    sender === win.webContents ? win : null

  electron().BrowserWindow.fromWebContents
    .mockImplementation(fromWebContents)

  return { sender: win.webContents }
}

describe('toggle', { concurrent: false }, () => {
  it('maximizes a restored window', () => {
    const win = fakeWindow(false)

    loadMaximize().toggle(win)

    expect(win.maximize).toHaveBeenCalledOnce()
    expect(win.unmaximize).not.toHaveBeenCalled()
  })

  it('restores a maximized window', () => {
    const win = fakeWindow(true)

    loadMaximize().toggle(win)

    expect(win.unmaximize).toHaveBeenCalledOnce()
    expect(win.maximize).not.toHaveBeenCalled()
  })
})

describe('forward', { concurrent: false }, () => {
  it('sends each change of the maximized state', () => {
    const win = fakeWindow(false)
    loadMaximize().forward(win)

    win.emit('maximize')
    win.emit('unmaximize')

    expect(win.webContents.send.mock.calls).toEqual([
      ['window:maximized-changed', true],
      ['window:maximized-changed', false]
    ])
  })
})

describe('register', { concurrent: false }, () => {
  it('toggles the window the request came from', () => {
    const win = fakeWindow(true)
    loadMaximize().register()

    ipcHandler('window:toggle-maximize')(ipcEvent(win))

    expect(win.unmaximize).toHaveBeenCalledOnce()
  })

  it('answers whether the window is maximized', () => {
    const win = fakeWindow(true)
    loadMaximize().register()

    const maximized =
      ipcHandler('window:is-maximized')(ipcEvent(win))

    expect(maximized).toBe(true)
  })

  it('ignores requests from no window', () => {
    loadMaximize().register()
    const ev = { sender: {} }

    ipcHandler('window:toggle-maximize')(ev)
    const maximized = ipcHandler('window:is-maximized')(ev)

    expect(maximized).toBe(false)
  })
})
