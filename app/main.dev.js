const app = require('electron').app;
const BrowserWindow = require('electron').BrowserWindow;
const ipcMain = require('electron').ipcMain;
const Menu = require('electron').Menu

const _ = require('underscore');
const settings = require('electron-settings');
const defaultSettings = require('./config/settings.json');

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')();

  // Since we'll be loading our main script from a development server
  // using the https protocol, and Node's module system is supposed
  // to work only with the filesystem, we have to manually add our
  // locally installed modules to Electron's globalPath property.
  // By the way, Electron does a little bit of hacking with Node's
  // module system and I find that there is little information
  // about that online.

  const path = require('path');
  const modulesPath = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(modulesPath);
}

const installExtensions = async () => {
  if (process.env.NODE_ENV === 'development') {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  }
};

async function openMainWindow() {
  await installExtensions();

  if (_.isEmpty(settings.getAll()))
    settings.setAll(defaultSettings);

  const entryFile = process.env.NODE_ENV === 'development'
    ? `file://${__dirname}/app.dev.html`
    : `file://${__dirname}/app.html`

  mainWindow = new BrowserWindow({
    width: 1080,
    height: 660,
    show: false,
    frame: false,
  });

  mainWindow.loadURL(entryFile);

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  //if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([{
        label: 'Inspect element',
        click: function() {
          mainWindow.inspectElement(x, y);
        }
      }]).popup(mainWindow);
    });
  //}
}

app.on('ready', openMainWindow);
app.on('activate', openMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit();
});
