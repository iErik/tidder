import { app, ipcMain, BrowserWindow, Menu } from 'electron'
import initStore from './store/initStore'

export default class Main {
  static mainWindow: Electron.BrowserWindow
  static application: Electron.App
  static BrowserWindow: typeof BrowserWindow
  static reduxStore: any

  static mainWindowOpts: Object =
    { width: 1080
    , height: 660
    , minWidht: 960
    , minHeight: 260
    , show: false
    , frame: false
    , hasShadow: true
    , webPreferences: { nodeIntegration: true }
    }

  private static initEnvironment () {
    if (process.env.NODE_ENV === 'production')
      require('source-map-support').install()

    if (process.env.NODE_ENV === 'development') {
      require('electron-debug')()

      const path = require('path')
      const modulesPath = path.join(__dirname, '..', 'app', 'node_modules')
      require('module').globalPaths.push(modulesPath)
    }
  }

  private static async installExtensions () {
    const installer = require('electron-devtools-installer')
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS

    const extensions =
      [ 'REACT_DEVELOPER_TOOLS'
      , 'REDUX_DEVTOOLS'
      ]

    return Promise
      .all(extensions.map(ex => installer.default(installer[ex], forceDownload)))
      .catch(console.log)
  }

  private static onRendererReload (ev: Event) {
    delete require.cache[require.resolve('./store/reducers')]
    Main.reduxStore.replaceReducer(require('./store/reducers'))
    ev.returnValue = true
  }

  private static onDevCtxMenu (_: Event, props: { x: Number, y: Number }) {
    const { x, y } = props

    Menu.buildFromTemplate([{
      label: 'Inspect element',
      click: () => (Main.mainWindow as any).inspectElement(x, y)
    }]).popup(Main.mainWindow as any)
  }

  private static onWindowAllClosed () {
    if (process.platform !== 'darwin')
      Main.application.quit()
  }

  private static onClose () {
    Main.mainWindow = null
  }

  private static async onReady () {
    if (Main.mainWindow) return

    if (process.env.NODE_ENV === 'development')
      await Main.installExtensions()

    Main.reduxStore = initStore()

    const appFile = process.env.NODE_ENV === 'development'
      ? 'app.dev.html'
      : 'app.html'

    Main.mainWindow = new Main.BrowserWindow(Main.mainWindowOpts)
    Main.mainWindow.loadURL(`file://${__dirname}/${appFile}`)
    Main.mainWindow.on('closed', Main.onClose)

    Main.mainWindow.webContents.on('did-finish-load', () => {
      Main.mainWindow.show()
      Main.mainWindow.focus()
    })

    if (process.env.NODE_ENV === 'development')
      Main.mainWindow.webContents.on('context-menu', Main.onDevCtxMenu)

    ipcMain.on('renderer-reload', Main.onRendererReload)
  }

  static main (app: Electron.App, browserWindow: typeof BrowserWindow) {
    Main.initEnvironment()

    Main.BrowserWindow = browserWindow
    Main.application = app

    Main.application.on('ready', Main.onReady)
    Main.application.on('activate', Main.onReady)
    Main.application.on('window-all-closed', Main.onWindowAllClosed)
  }
}


// Initialize app
Main.main(app, BrowserWindow)
