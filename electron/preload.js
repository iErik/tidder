// Exposes the few native features the renderer needs as window.tidder.
// The renderer runs with context isolation and without Node integration,
// so everything it used to do through `remote` goes through here.

const { contextBridge, ipcRenderer } = require('electron')

const isDev = ipcRenderer.sendSync('app:is-dev')

const settingsCache = ipcRenderer.sendSync('settings:get-all')
const settingsWatchers = []

// Right-clicks the main process forwards (see contextMenu.js)
const contextMenuListeners = new Set()

ipcRenderer.on('context-menu:forwarded', (ev, params) => {
  contextMenuListeners.forEach(listener => listener(params))
})

ipcRenderer.on('settings:changed', (ev, key, value) => {
  settingsCache[key] = value

  settingsWatchers
    .filter(watcher => watcher.key === key)
    .forEach(watcher => watcher.callback(value))
})

contextBridge.exposeInMainWorld('tidder', {
  platform: process.platform,
  isDev,

  window: {
    close: () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize')
  },

  openExternal: (url) => ipcRenderer.send('shell:open-external', url),

  openPopup: (url, width, height, title) =>
    ipcRenderer.send('window:popup', url, width, height, title),

  contextMenu: {
    inspect: (x, y) => ipcRenderer.send('context-menu:inspect', x, y),
    copyImage: (x, y) => ipcRenderer.invoke('context-menu:copy-image', x, y),
    writeText: (text) => ipcRenderer.send('context-menu:write-text', text),
    edit: (command) => ipcRenderer.send('context-menu:edit', command),

    download: (url, suggestedName) =>
      ipcRenderer.invoke('context-menu:download', url, suggestedName),

    onForwarded: (listener) => {
      contextMenuListeners.add(listener)
      return { dispose: () => contextMenuListeners.delete(listener) }
    }
  },

  auth: {
    login: () => ipcRenderer.invoke('auth:login'),
    cancel: () => ipcRenderer.send('auth:cancel'),
    refresh: () => ipcRenderer.invoke('auth:refresh'),
    logout: () => ipcRenderer.invoke('auth:logout')
  },

  settings: {
    get: (key) => settingsCache[key],

    set: (key, value) => {
      settingsCache[key] = value
      ipcRenderer.send('settings:set', key, value)
    },

    watch: (key, callback) => {
      const watcher = { key, callback }
      settingsWatchers.push(watcher)

      return {
        dispose: () => {
          const index = settingsWatchers.indexOf(watcher)
          if (index !== -1) settingsWatchers.splice(index, 1)
        }
      }
    }
  }
})
