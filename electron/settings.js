// A small JSON settings store that replaces electron-settings. It uses the
// same file electron-settings v3 wrote (userData/Settings), so settings
// saved by older versions of Tidder carry over.

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const defaultSettings = require('../app/config/settings.json');

let settingsPath = null;
let settings = null;

function load() {
  settingsPath = path.join(app.getPath('userData'), 'Settings');

  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (err) {
    settings = {};
  }

  if (Object.keys(settings).length === 0) {
    settings = { ...defaultSettings };
    save();
  }
}

function save() {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function getAll() {
  return settings;
}

// Only keys that have a default can be set, since the renderer shows
// untrusted content from Reddit. Returns whether the value was saved.

function set(key, value) {
  if (!Object.prototype.hasOwnProperty.call(defaultSettings, key))
    return false;

  settings[key] = value;
  save();

  return true;
}

module.exports = { load, getAll, set };
