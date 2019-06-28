import { app, BrowserWindow, ipcMain, Menu } from 'electron'
// import settings from 'electron-settings'
// import defaults from './config/settings'

import configureStore from './store/configureStore'

let mainWindow = null

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support')
  sourceMapSupport.install()
}

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')()

  const path = require('path')
  const modulesPath = path.join(__dirname, '..', 'app', 'node_modules')
  require('module').globalPaths.push(modulesPath)
}

const installExtensions = async () => {
  if (process.env.NODE_ENV === 'development') {
    const installer = require('electron-devtools-installer')
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS

    const extensions = [
      'REACT_DEVELOPER_TOOLS',
      'REDUX_DEVTOOLS'
    ]

    return Promise
      .all(extensions.map(ex => installer.default(installer[ex], forceDownload)))
      .catch(console.log)
  }
}

/*
const initialSetup = async () => {
  settings.defaults(defaults)
  const runInitialSetup = await settings.get('runInitialSetup')

  if (runInitialSetup) {
    await runSeeders()
    await settings.set('runInitialSetup', false)
  }
}
*/


async function openMainWindow () {
  await installExtensions()

  // const store = configureStore('main')
  const entryFile = process.env.NODE_ENV === 'development'
    ? `file://${__dirname}/app.dev.html`
    : `file://${__dirname}/app.html`

  mainWindow = new BrowserWindow({
    width: 1080,
    height: 660,
    minWidth: 960,
    minHeight: 260,

    show: false,
    frame: false,
    hasShadow: true,

    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(entryFile)

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('closed', () => mainWindow = null)

  /*
  ipcMain.on('renderer-reload', (ev, action) => {
    delete require.cache[require.resolve('./reducers')]
    store.replaceReducer(require('./reducers'))
    ev.returnValue = true
  })
  */

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props

      Menu.buildFromTemplate([{
        label: 'Inspect element',
        click: () => mainWindow.inspectElement(x, y)
      }]).popup(mainWindow)
    })
  }
}

app.on('ready', openMainWindow)

app.on('activate', () => {
  if (mainWindow === null) openMainWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
