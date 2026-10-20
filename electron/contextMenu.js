// The native side of the app's context menu, which the renderer draws
// itself (app/components/ContextMenu): inspecting, copying an image,
// writing to the clipboard, downloading and editing the focused field,
// plus forwarding each right-click with what it landed on (the
// selection, a link, a text field), including those inside an embed's
// iframe, which the renderer can't see.

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

const { parseDashManifest } = require('./dashManifest')
const { remux, urlSource } = require('./remux')

function isWebUrl(url) {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

// Asks where to save a download, starting in Downloads with the
// suggested name. Resolves to the chosen path, or null if cancelled
async function chooseFile(win, suggestedName) {
  // Only the name, so the dialog always starts in Downloads
  const options = {
    defaultPath: path.join(
      app.getPath('downloads'),
      path.basename(suggestedName)
    )
  }
  const { canceled, filePath } = win
    ? await dialog.showSaveDialog(win, options)
    : await dialog.showSaveDialog(options)

  return canceled || !filePath ? null : filePath
}

// Asks where to save url, then saves it there. Resolves to
// { status: 'saved', fileName }, { status: 'cancelled' } or
// { status: 'failed' }
async function download(win, url, suggestedName) {
  if (!isWebUrl(url))
    return { status: 'failed' }

  const filePath = await chooseFile(win, suggestedName)
  if (!filePath)
    return { status: 'cancelled' }

  // Only a file this download opened is removed on failure,
  // never one it couldn't open, like a read-only file the
  // user chose to replace
  let opened = false

  try {
    const res = await net.fetch(url)

    if (!res.ok || !res.body)
      throw new Error(`${res.status} ${res.statusText} (${url})`)

    const file = fs.createWriteStream(filePath)
    file.once('open', () => { opened = true })
    await pipeline(Readable.fromWeb(res.body), file)

    return { status: 'saved', fileName: path.basename(filePath) }
  } catch (err) {
    console.error('Download failed:', err)

    if (opened)
      removePartial(filePath)

    return { status: 'failed' }
  }
}

// Like download, for a Reddit video with sound: reads its DASH
// manifest, then combines the best video and audio files it lists
// into the chosen file. Fails rather than save a silent video
async function downloadVideo(win, dashUrl, suggestedName) {
  if (!isWebUrl(dashUrl))
    return { status: 'failed' }

  const filePath = await chooseFile(win, suggestedName)
  if (!filePath)
    return { status: 'cancelled' }

  // Set once the file is open, so only then is it removed on
  // failure (see download)
  let handle = null

  try {
    const res = await net.fetch(dashUrl)

    if (!res.ok)
      throw new Error(`${res.status} ${res.statusText} (${dashUrl})`)

    const { video, audio } =
      parseDashManifest(await res.text(), res.url || dashUrl)

    if (!audio)
      throw new Error(`The DASH manifest has no audio (${dashUrl})`)

    const fetchFn = (input, init) => net.fetch(input, init)
    handle = await fs.promises.open(filePath, 'w')
    await remux(
      urlSource(video, fetchFn),
      urlSource(audio, fetchFn),
      handle
    )
    await handle.close()

    return { status: 'saved', fileName: path.basename(filePath) }
  } catch (err) {
    console.error('Video download failed:', err)

    if (handle) {
      await handle.close().catch(() => { })
      removePartial(filePath)
    }

    return { status: 'failed' }
  }
}

// A failed removal is only logged, so the download still
// resolves to failed
function removePartial(filePath) {
  try {
    fs.rmSync(filePath, { force: true })
  } catch (err) {
    console.error('Couldn\'t remove the partial download:', err)
  }
}

// The edit commands the renderer can run on the focused field, as
// webContents methods
const EDIT_COMMANDS = new Set(['cut', 'copy', 'paste', 'selectAll'])

// Chromium's canPaste only says the field takes a paste. Its own menu
// also checks that the clipboard has text, so this does too, only for
// a right-click on a field, and the renderer never reads the clipboard
function editFlags(params) {
  const flags = { ...params.editFlags }

  if (params.isEditable && flags.canPaste)
    flags.canPaste = clipboard.readText() !== ''

  return flags
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
    linkText: params.linkText,
    srcURL: params.srcURL,
    mediaType: params.mediaType,
    isEditable: params.isEditable,
    editFlags: editFlags(params)
  }
}

// Electron only fires context-menu for right-clicks the page didn't
// cancel. The renderer leaves its own uncancelled, so it learns what
// they landed on this way, and gets those inside iframes, which it
// never sees
function forward(webContents) {
  webContents.on('context-menu', (ev, params) => {
    webContents.send(
      'context-menu:forwarded',
      forwardedParams(webContents, params)
    )
  })
}

function register({ isDev }) {
  ipcMain.handle('context-menu:download', (ev, url, suggestedName) =>
    download(BrowserWindow.fromWebContents(ev.sender), url, suggestedName))

  ipcMain.handle(
    'context-menu:download-video',
    (ev, dashUrl, suggestedName) => downloadVideo(
      BrowserWindow.fromWebContents(ev.sender),
      dashUrl,
      suggestedName
    )
  )

  ipcMain.handle('context-menu:copy-image', (ev, x, y) =>
    ev.sender.copyImageAt(x, y))

  ipcMain.on('context-menu:write-text', (ev, text) =>
    clipboard.writeText(String(text)))

  // Acts on the field that has focus: the one right-clicked (see
  // app/components/ContextMenu)
  ipcMain.on('context-menu:edit', (ev, command) => {
    if (EDIT_COMMANDS.has(command))
      ev.sender[command]()
  })

  ipcMain.on('context-menu:inspect', (ev, x, y) => {
    if (isDev)
      ev.sender.inspectElement(x, y)
  })
}

module.exports = {
  download,
  downloadVideo,
  forward,
  register
}
