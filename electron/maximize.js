// The native side of the maximize window control, which the
// renderer draws itself (the main window is frameless):
// toggling between maximized and restored, and telling the
// renderer whenever that state changes, through the control
// or not (double-clicking the title area, OS shortcuts,
// snapping).

const { BrowserWindow, ipcMain } = require('electron')

// Restores win if it's maximized, maximizes it otherwise.
// Decided here, so a stale state in the renderer can't send
// the wrong command
function toggle(win) {
  if (win.isMaximized())
    win.unmaximize()
  else
    win.maximize()
}

// Sends each change of win's maximized state to its page
function forward(win) {
  const send = (maximized) => win.webContents.send(
    'window:maximized-changed',
    maximized
  )

  win.on('maximize', () => send(true))
  win.on('unmaximize', () => send(false))
}

function register() {
  ipcMain.on('window:toggle-maximize', (ev) => {
    const win = BrowserWindow.fromWebContents(ev.sender)
    if (win) toggle(win)
  })

  ipcMain.handle('window:is-maximized', (ev) => {
    const win = BrowserWindow.fromWebContents(ev.sender)
    return Boolean(win && win.isMaximized())
  })
}

module.exports = {
  forward,
  register,
  toggle
}
