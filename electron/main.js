const path = require('path');
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');

const settings = require('./settings');

const devServerUrl = process.env.TIDDER_DEV_URL;
const isDev = Boolean(devServerUrl);

const oauthConfig = require('../app/config/authConfig.json');

let mainWindow = null;

function isWebUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch (err) {
    return false;
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
  });

  if (isDev)
    mainWindow.loadURL(devServerUrl);
  else
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'browser', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Links inside the app (post content, comments) open in the default browser
  // instead of replacing the app's own window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isWebUrl(url))
      shell.openExternal(url);

    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (ev, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      ev.preventDefault();

      if (isWebUrl(url))
        shell.openExternal(url);
    }
  });

  if (isDev) {
    mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([{
        label: 'Inspect element',
        click: () => mainWindow.webContents.inspectElement(x, y)
      }]).popup({ window: mainWindow });
    });
  }
}

// Window controls (the main window is frameless)

ipcMain.on('window:close', () => mainWindow && mainWindow.close());
ipcMain.on('window:minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('window:maximize', () => mainWindow && mainWindow.maximize());

// Settings

ipcMain.on('settings:get-all', (ev) => {
  ev.returnValue = settings.getAll();
});

ipcMain.on('settings:set', (ev, key, value) => {
  settings.set(key, value);

  BrowserWindow.getAllWindows().forEach(win =>
    win.webContents.send('settings:changed', key, value));
});

// External links and popups

ipcMain.on('shell:open-external', (ev, url) => {
  if (isWebUrl(url))
    shell.openExternal(url);
});

ipcMain.on('window:popup', (ev, url, width, height, title) => {
  if (!isWebUrl(url))
    return;

  const popup = new BrowserWindow({
    width,
    height,
    title: title || '',
    parent: mainWindow || undefined,
    webPreferences: { sandbox: true }
  });

  popup.loadURL(url);
});

// Reddit login: opens Reddit's authorize page in its own window and resolves
// with the hash fragment (including the leading '#') Reddit appends to the
// redirect URI, or null if the user closes the window.

ipcMain.handle('auth:login', (ev, url) => {
  if (!url.startsWith(`${oauthConfig.loginUrl}?`))
    throw new Error('Unexpected login URL');

  return new Promise((resolve) => {
    let settled = false;

    const authWindow = new BrowserWindow({
      width: 875,
      height: 600,
      show: false,
      parent: mainWindow || undefined,
      webPreferences: { sandbox: true }
    });

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);

      if (!authWindow.isDestroyed())
        authWindow.destroy();
    };

    const handleNavigation = (navEv, newUrl) => {
      if (!newUrl.startsWith(oauthConfig.redirectUri))
        return;

      navEv.preventDefault();

      const hashIndex = newUrl.indexOf('#');
      finish(hashIndex === -1 ? '' : newUrl.slice(hashIndex));
    };

    authWindow.webContents.on('will-redirect', handleNavigation);
    authWindow.webContents.on('will-navigate', handleNavigation);
    authWindow.once('ready-to-show', () => authWindow.show());
    authWindow.on('closed', () => finish(null));

    authWindow.loadURL(url);
  });
});

app.whenReady().then(() => {
  settings.load();
  openMainWindow();
});

app.on('activate', () => {
  if (mainWindow === null)
    openMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit();
});
