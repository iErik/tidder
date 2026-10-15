import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import {
  describe,
  expect,
  it
} from 'vitest'

import { electron } from './test/electron.js'

const require = createRequire(import.meta.url)
const defaults = require('../app/config/settings.json')

function settingsFile() {
  return path.join(electron().app.getPath('userData'), 'Settings')
}

function saved() {
  return JSON.parse(fs.readFileSync(settingsFile(), 'utf8'))
}

// Loads the store after the test has set up the file
function loadSettings() {
  const settings = require('./settings.js')
  settings.load()
  return settings
}

describe('load', { concurrent: false }, () => {
  it.each([
    ['missing', null],
    ['empty', ''],
    ['corrupt', '{ "appTheme": '],
    ['an empty object', '{}']
  ])('seeds the defaults when the file is %s',
    (_, contents) => {
      if (contents !== null)
        fs.writeFileSync(settingsFile(), contents)

      expect(loadSettings().getAll()).toEqual(defaults)
      expect(saved()).toEqual(defaults)
    })

  it('keeps the settings already saved', () => {
    fs.writeFileSync(settingsFile(),
      JSON.stringify({ appTheme: 'night' }))

    expect(loadSettings().getAll()).toEqual({ appTheme: 'night' })
  })
})

describe('set', { concurrent: false }, () => {
  it('persists a key that has a default', () => {
    const settings = loadSettings()

    expect(settings.set('appTheme', 'night')).toBe(true)
    expect(settings.getAll().appTheme).toBe('night')
    expect(saved().appTheme).toBe('night')
  })

  it('refuses a key without a default', () => {
    const settings = loadSettings()

    expect(settings.set('unknown', 'value')).toBe(false)
    expect(settings.getAll()).not.toHaveProperty('unknown')
    expect(saved()).not.toHaveProperty('unknown')
  })
})
