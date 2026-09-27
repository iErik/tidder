// Exposes the few native features the renderer needs as window.tidder.
// The renderer runs with context isolation and without Node integration,
// so everything it used to do through `remote` goes through here.

const { contextBridge, ipcRenderer } = require('electron');

const settingsCache = ipcRenderer.sendSync('settings:get-all');
const settingsWatchers = [];

ipcRenderer.on('settings:changed', (ev, key, value) => {
  settingsCache[key] = value;

  settingsWatchers
    .filter(watcher => watcher.key === key)
    .forEach(watcher => watcher.callback(value));
});

contextBridge.exposeInMainWorld('tidder', {
  platform: process.platform,

  window: {
    close: () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize')
  },

  openExternal: (url) => ipcRenderer.send('shell:open-external', url),

  openPopup: (url, width, height, title) =>
    ipcRenderer.send('window:popup', url, width, height, title),

  auth: {
    login: () => ipcRenderer.invoke('auth:login'),
    cancel: () => ipcRenderer.send('auth:cancel'),
    refresh: () => ipcRenderer.invoke('auth:refresh'),
    logout: () => ipcRenderer.invoke('auth:logout')
  },

  settings: {
    get: (key) => settingsCache[key],

    set: (key, value) => {
      settingsCache[key] = value;
      ipcRenderer.send('settings:set', key, value);
    },

    watch: (key, callback) => {
      const watcher = { key, callback };
      settingsWatchers.push(watcher);

      return {
        dispose: () => {
          const index = settingsWatchers.indexOf(watcher);
          if (index !== -1) settingsWatchers.splice(index, 1);
        }
      };
    }
  }
});
