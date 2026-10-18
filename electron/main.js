const path = require('path')
const {
  app,
  BrowserWindow,
  ipcMain,
  session,
  shell
} = require('electron')

const auth = require('./auth')
const contextMenu = require('./contextMenu')
const settings = require('./settings')

const devServerUrl = process.env.TIDDER_DEV_URL
const isDev = Boolean(devServerUrl)

const oauthConfig = require('../app/config/authConfig.json')

let mainWindow = null

function isWebUrl(url) {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

function openMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 660,
    minWidth: 960,
    minHeight: 260,

    show: false,
    frame: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  if (isDev)
    mainWindow.loadURL(devServerUrl)
  else
    mainWindow.loadFile(path.join(__dirname, '..', 'dist',
      'renderer', 'browser', 'index.html'))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Links inside the app (post content, comments) open in the default browser
  // instead of replacing the app's own window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isWebUrl(url))
      shell.openExternal(url)

    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (ev, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      ev.preventDefault()

      if (isWebUrl(url))
        shell.openExternal(url)
    }
  })

  // The renderer draws the context menu (see contextMenu.js)
  contextMenu.forward(mainWindow.webContents)
}

// Window controls (the main window is frameless)

ipcMain.on('window:close', () => mainWindow && mainWindow.close())
ipcMain.on('window:minimize', () => mainWindow && mainWindow.minimize())
ipcMain.on('window:maximize', () => mainWindow && mainWindow.maximize())

// Whether the app runs under the dev server, for the renderer

ipcMain.on('app:is-dev', (ev) => {
  ev.returnValue = isDev
})

// The context menu's native features (see contextMenu.js)

contextMenu.register({ isDev })

// Settings

ipcMain.on('settings:get-all', (ev) => {
  ev.returnValue = settings.getAll()
})

ipcMain.on('settings:set', (ev, key, value) => {
  if (!settings.set(key, value))
    return

  BrowserWindow.getAllWindows().forEach(win =>
    win.webContents.send('settings:changed', key, value))
})

// External links and popups

ipcMain.on('shell:open-external', (ev, url) => {
  if (isWebUrl(url))
    shell.openExternal(url)
})

ipcMain.on('window:popup', (ev, url, width, height, title) => {
  if (!isWebUrl(url))
    return

  const popup = new BrowserWindow({
    width,
    height,
    title: title || '',
    parent: mainWindow || undefined,
    webPreferences: { sandbox: true }
  })

  popup.loadURL(url)
})

// Reddit login (see auth/). Errors are returned as { error } rather than
// thrown, so the renderer gets a readable message.

ipcMain.handle('auth:login', async () => {
  try {
    const tokens = await auth.login()

    if (tokens && mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()

      if (process.platform === 'darwin')
        app.focus({ steal: true })
    }

    return tokens
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.on('auth:cancel', () => auth.cancelLogin())
ipcMain.handle('auth:refresh', () => auth.refresh())
ipcMain.handle('auth:logout', () => auth.logout())

app.whenReady().then(() => {
  settings.load()

  // Reddit asks API clients to identify themselves with a descriptive
  // User-Agent instead of a generic browser one.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [`${oauthConfig.authBaseURI}/*`] },
    (details, callback) => {
      details.requestHeaders['User-Agent'] = auth.userAgent()
      callback({ requestHeaders: details.requestHeaders })
    })

  openMainWindow()
})

app.on('activate', () => {
  if (mainWindow === null)
    openMainWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit()
})
