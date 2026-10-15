// Runs before every main-process test file.
//
// electron/ is CommonJS, and vi.mock() doesn't reach a
// require(), so the fake goes straight into Node's module
// cache. vi.resetModules() doesn't clear that cache either:
// the project's own files are dropped from it before each
// test, so every test requires them afresh

import { createRequire } from 'node:module'
import path from 'node:path'

import {
  afterEach,
  beforeEach
} from 'vitest'

import {
  createElectron,
  removeElectron
} from './electron.js'

const require = createRequire(import.meta.url)
const electronPath = require.resolve('electron')

const rootDir = path.resolve(import.meta.dirname, '../..')
const modulesDir = path.join(rootDir, 'node_modules')

const isOwnFile = file =>
  file.startsWith(rootDir + path.sep)
    && !file.startsWith(modulesDir + path.sep)

beforeEach(() => {
  for (const file of Object.keys(require.cache))
    if (isOwnFile(file)) delete require.cache[file]

  require.cache[electronPath] = {
    id: electronPath,
    filename: electronPath,
    loaded: true,
    exports: createElectron()
  }
})

afterEach(() => {
  delete require.cache[electronPath]
  removeElectron()
})
