import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import {
  afterEach,
  beforeEach,
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

const IMAGE_URL = 'https://i.redd.it/image.jpg'

function loadContextMenu() {
  return require('./contextMenu.js')
}

function downloads(...parts) {
  return path.join(electron().app.getPath('downloads'), ...parts)
}

// The user picks this file in the save dialog
function chooseFile(filePath) {
  electron().dialog.showSaveDialog
    .mockResolvedValueOnce({ canceled: false, filePath })
}

// A response whose body fails after its first chunk
function brokenResponse() {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('partial'))
      controller.error(new Error('connection reset'))
    }
  })

  return new Response(body)
}

describe('download', { concurrent: false }, () => {
  beforeEach(() => {
    // A failed download is logged
    vi.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('saves the file the user picks', async () => {
    const file = downloads('picked.jpg')
    chooseFile(file)
    electron().net.fetch.mockResolvedValueOnce(new Response('image'))

    const result = await loadContextMenu()
      .download(null, IMAGE_URL, 'A title.jpg')

    expect(result).toEqual({ status: 'saved', fileName: 'picked.jpg' })
    expect(fs.readFileSync(file, 'utf8')).toBe('image')
    expect(electron().net.fetch).toHaveBeenCalledWith(IMAGE_URL)
  })

  it('suggests the name in Downloads', async () => {
    await loadContextMenu().download(null, IMAGE_URL, 'A title.jpg')

    const [options] = electron().dialog.showSaveDialog.mock.calls[0]
    expect(options.defaultPath).toBe(downloads('A title.jpg'))
  })

  it('asks over the window it was given', async () => {
    const win = { id: 1 }
    await loadContextMenu().download(win, IMAGE_URL, 'a.jpg')

    expect(electron().dialog.showSaveDialog.mock.calls[0][0]).toBe(win)
  })

  it("doesn't fetch anything when cancelled", async () => {
    const result = await loadContextMenu()
      .download(null, IMAGE_URL, 'a.jpg')

    expect(result).toEqual({ status: 'cancelled' })
    expect(electron().net.fetch).not.toHaveBeenCalled()
  })

  it('fails without a file when the request fails', async () => {
    const file = downloads('a.jpg')
    chooseFile(file)
    electron().net.fetch.mockResolvedValueOnce(
      new Response('', { status: 404 })
    )

    const result = await loadContextMenu()
      .download(null, IMAGE_URL, 'a.jpg')

    expect(result).toEqual({ status: 'failed' })
    expect(fs.existsSync(file)).toBe(false)
  })

  it('removes what it wrote when the body fails', async () => {
    const file = downloads('a.jpg')
    chooseFile(file)
    electron().net.fetch.mockResolvedValueOnce(brokenResponse())

    const result = await loadContextMenu()
      .download(null, IMAGE_URL, 'a.jpg')

    expect(result).toEqual({ status: 'failed' })
    expect(fs.existsSync(file)).toBe(false)
  })

  it('leaves a file it never wrote to alone', async () => {
    const file = downloads('existing.jpg')
    fs.writeFileSync(file, 'keep me')
    chooseFile(file)

    // net.fetch rejects, as it isn't stubbed
    const result = await loadContextMenu()
      .download(null, IMAGE_URL, 'existing.jpg')

    expect(result).toEqual({ status: 'failed' })
    expect(fs.readFileSync(file, 'utf8')).toBe('keep me')
  })

  it('leaves a file it couldn\'t open alone', async () => {
    const file = downloads('read-only.jpg')
    fs.writeFileSync(file, 'keep me')
    fs.chmodSync(file, 0o444)
    chooseFile(file)
    electron().net.fetch.mockResolvedValueOnce(new Response('image'))

    const result = await loadContextMenu()
      .download(null, IMAGE_URL, 'read-only.jpg')

    expect(result).toEqual({ status: 'failed' })
    expect(fs.readFileSync(file, 'utf8')).toBe('keep me')
  })

  it('fails when the file can\'t be removed', async () => {
    const file = downloads('a.jpg')
    chooseFile(file)
    electron().net.fetch.mockResolvedValueOnce(brokenResponse())
    vi.spyOn(fs, 'rmSync').mockImplementation(() => {
      throw new Error('EPERM')
    })

    const result = await loadContextMenu()
      .download(null, IMAGE_URL, 'a.jpg')

    expect(result).toEqual({ status: 'failed' })
    expect(fs.rmSync).toHaveBeenCalled()
  })

  it('keeps the suggestion inside Downloads', async () => {
    await loadContextMenu()
      .download(null, IMAGE_URL, '../../outside.jpg')

    const [options] = electron().dialog.showSaveDialog.mock.calls[0]
    expect(options.defaultPath).toBe(downloads('outside.jpg'))
  })

  it('only downloads web URLs', async () => {
    const result = await loadContextMenu()
      .download(null, 'file:///etc/passwd', 'passwd')

    expect(result).toEqual({ status: 'failed' })
    expect(electron().dialog.showSaveDialog).not.toHaveBeenCalled()
  })
})

// A webContents that records what it sends
function fakeWebContents() {
  const listeners = {}

  return {
    mainFrame: { name: 'main' },
    on: vi.fn((event, listener) => { listeners[event] = listener }),
    send: vi.fn(),
    rightClick: (params) => listeners['context-menu']({}, params)
  }
}

const PARAMS = {
  x: 10,
  y: 20,
  selectionText: '',
  linkURL: '',
  linkText: '',
  srcURL: 'https://www.youtube.com/embed/id',
  mediaType: 'none',
  isEditable: false,
  editFlags: { canCopy: false, canPaste: false }
}

describe('forward', { concurrent: false }, () => {
  it('sends right-clicks in a subframe as plain data', () => {
    const webContents = fakeWebContents()
    loadContextMenu().forward(webContents)

    webContents.rightClick({ ...PARAMS, frame: { name: 'embed' } })

    const [channel, sent] = webContents.send.mock.calls[0]
    expect(channel).toBe('context-menu:forwarded')
    expect(sent).toEqual({ ...PARAMS, isSubframe: true })
    expect(sent).not.toHaveProperty('frame')
  })

  it('tells right-clicks in the page itself apart', () => {
    const webContents = fakeWebContents()
    loadContextMenu().forward(webContents)

    webContents.rightClick({ ...PARAMS, frame: webContents.mainFrame })

    expect(webContents.send.mock.calls[0][1].isSubframe).toBe(false)
  })

  it('sends what a right-click in the page landed on', () => {
    electron().clipboard.readText.mockReturnValue('Some text')
    const webContents = fakeWebContents()
    loadContextMenu().forward(webContents)
    const target = {
      selectionText: 'Selected text',
      linkURL: 'https://www.reddit.com/r/pics',
      linkText: 'r/pics',
      isEditable: true,
      editFlags: { canCopy: true, canPaste: true }
    }

    webContents.rightClick({
      ...PARAMS,
      ...target,
      frame: webContents.mainFrame
    })

    expect(webContents.send.mock.calls[0][1]).toMatchObject(target)
  })

  // Electron's canPaste ignores what the clipboard holds
  it.each([
    ['empty', '', false],
    ['holding text', 'Some text', true]
  ])(
    'lets a field take a paste with the clipboard %s',
    (_, text, canPaste) => {
      electron().clipboard.readText.mockReturnValue(text)
      const webContents = fakeWebContents()
      loadContextMenu().forward(webContents)

      webContents.rightClick({
        ...PARAMS,
        isEditable: true,
        editFlags: { canCopy: false, canPaste: true }
      })

      expect(webContents.send.mock.calls[0][1].editFlags)
        .toEqual({ canCopy: false, canPaste })
    }
  )

  it('never lets a read-only field take a paste', () => {
    electron().clipboard.readText.mockReturnValue('Some text')
    const webContents = fakeWebContents()
    loadContextMenu().forward(webContents)

    webContents.rightClick({
      ...PARAMS,
      isEditable: true,
      editFlags: { canCopy: false, canPaste: false }
    })

    expect(webContents.send.mock.calls[0][1].editFlags.canPaste)
      .toBe(false)
  })

  it('reads the clipboard only for a field', () => {
    const webContents = fakeWebContents()
    loadContextMenu().forward(webContents)

    webContents.rightClick({
      ...PARAMS,
      editFlags: { canCopy: false, canPaste: true }
    })

    expect(electron().clipboard.readText).not.toHaveBeenCalled()
  })
})

// The event an IPC handler gets, from the main window
function ipcEvent() {
  return {
    sender: {
      inspectElement: vi.fn(),
      copyImageAt: vi.fn(),
      cut: vi.fn(),
      copy: vi.fn(),
      paste: vi.fn(),
      selectAll: vi.fn()
    }
  }
}

describe('register', { concurrent: false }, () => {
  it('only inspects in dev', () => {
    loadContextMenu().register({ isDev: false })
    const ev = ipcEvent()

    ipcHandler('context-menu:inspect')(ev, 1, 2)

    expect(ev.sender.inspectElement).not.toHaveBeenCalled()
  })

  it('inspects the element at the point in dev', () => {
    loadContextMenu().register({ isDev: true })
    const ev = ipcEvent()

    ipcHandler('context-menu:inspect')(ev, 1, 2)

    expect(ev.sender.inspectElement).toHaveBeenCalledWith(1, 2)
  })

  it('copies the image at the point', async () => {
    loadContextMenu().register({ isDev: false })
    const ev = ipcEvent()

    await ipcHandler('context-menu:copy-image')(ev, 3, 4)

    expect(ev.sender.copyImageAt).toHaveBeenCalledWith(3, 4)
  })

  it('writes text to the clipboard', () => {
    loadContextMenu().register({ isDev: false })

    ipcHandler('context-menu:write-text')(ipcEvent(), IMAGE_URL)

    expect(electron().clipboard.writeText)
      .toHaveBeenCalledWith(IMAGE_URL)
  })

  it.each(['cut', 'copy', 'paste', 'selectAll'])(
    'runs %s on the sender',
    (command) => {
      loadContextMenu().register({ isDev: false })
      const ev = ipcEvent()

      ipcHandler('context-menu:edit')(ev, command)

      expect(ev.sender[command]).toHaveBeenCalledTimes(1)
    }
  )

  it('runs no other method of the sender', () => {
    loadContextMenu().register({ isDev: false })
    const ev = ipcEvent()

    expect(() => {
      ipcHandler('context-menu:edit')(ev, 'inspectElement')
      ipcHandler('context-menu:edit')(ev, 'toString')
    }).not.toThrow()

    expect(ev.sender.inspectElement).not.toHaveBeenCalled()
  })

  it('downloads over the sender\'s window', async () => {
    const win = { id: 1 }
    electron().BrowserWindow.fromWebContents.mockReturnValue(win)
    loadContextMenu().register({ isDev: false })

    const result = await ipcHandler('context-menu:download')(
      ipcEvent(), IMAGE_URL, 'a.jpg'
    )

    expect(result).toEqual({ status: 'cancelled' })
    expect(electron().dialog.showSaveDialog.mock.calls[0][0]).toBe(win)
  })
})
