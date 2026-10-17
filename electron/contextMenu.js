// The native side of the app's context menu, which the renderer draws
// itself (app/components/ContextMenu): inspecting, copying an image,
// writing to the clipboard and downloading, plus forwarding the
// right-clicks the renderer can't see, like those inside an embed's
// iframe.

const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const { pipeline } = require('stream/promises')
const {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  net
} = require('electron')

function isWebUrl(url) {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

// Asks where to save url, starting in Downloads with the suggested
// name, then saves it there. Resolves to { status: 'saved', fileName },
// { status: 'cancelled' } or { status: 'failed' }
async function download(win, url, suggestedName) {
  if (!isWebUrl(url))
    return { status: 'failed' }

  const options = {
    defaultPath: path.join(app.getPath('downloads'), suggestedName)
  }
  const { canceled, filePath } = win
    ? await dialog.showSaveDialog(win, options)
    : await dialog.showSaveDialog(options)

  if (canceled || !filePath)
    return { status: 'cancelled' }

  // Only a file this download started writing is removed on failure,
  // never one the user chose to replace that was never touched
  let writing = false

  try {
    const res = await net.fetch(url)

    if (!res.ok || !res.body)
      throw new Error(`${res.status} ${res.statusText} (${url})`)

    writing = true
    await pipeline(Readable.fromWeb(res.body),
      fs.createWriteStream(filePath))

    return { status: 'saved', fileName: path.basename(filePath) }
  } catch (err) {
    console.error('Download failed:', err)

    if (writing)
      fs.rmSync(filePath, { force: true })

    return { status: 'failed' }
  }
}

// The parts of Electron's context-menu params the renderer can use, as
// plain data (the frame itself can't be sent)
function forwardedParams(webContents, params) {
  return {
    x: params.x,
    y: params.y,
    isSubframe: Boolean(params.frame)
      && params.frame !== webContents.mainFrame,
    selectionText: params.selectionText,
    linkURL: params.linkURL,
    srcURL: params.srcURL,
    mediaType: params.mediaType,
    isEditable: params.isEditable,
    editFlags: { ...params.editFlags }
  }
}

// Electron only fires context-menu for right-clicks the page didn't
// handle itself, so the renderer gets the rest this way
function forward(webContents) {
  webContents.on('context-menu', (ev, params) => {
    webContents.send('context-menu:forwarded',
      forwardedParams(webContents, params))
  })
}

function register({ isDev }) {
  ipcMain.handle('context-menu:download', (ev, url, suggestedName) =>
    download(BrowserWindow.fromWebContents(ev.sender), url, suggestedName))

  ipcMain.handle('context-menu:copy-image', (ev, x, y) =>
    ev.sender.copyImageAt(x, y))

  ipcMain.on('context-menu:write-text', (ev, text) =>
    clipboard.writeText(String(text)))

  ipcMain.on('context-menu:inspect', (ev, x, y) => {
    if (isDev)
      ev.sender.inspectElement(x, y)
  })
}

module.exports = {
  download,
  forward,
  register
}
