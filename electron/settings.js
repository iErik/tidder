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

function set(key, value) {
  settings[key] = value;
  save();
}

module.exports = { load, getAll, set };
