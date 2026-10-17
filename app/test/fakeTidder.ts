// A fake of the preload bridge (window.tidder) for renderer
// tests. setup.ts installs a new one before each test; read
// it with tidder() to stub or check a method:
//
//   tidder().auth.refresh.mockResolvedValue(null)

import {
  vi,
  type Mock
} from 'vitest'

import defaultSettings from 'config/settings.json'

// TidderBridge with every method a mock, so a change to the
// bridge's type breaks the fake at compile time
type Fake<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown
    ? Mock<T[K]>
    : T[K] extends object ? Fake<T[K]> : T[K]
}

export type FakeTidder = Fake<TidderBridge>

type Watcher = (value: unknown) => void
type ContextMenuListener = (params: TidderContextMenuParams) => void

// Settings live in memory, seeded from the defaults like the
// real store. As in the app, set() notifies the watchers
export function createFakeTidder(
  settings: Record<string, unknown> = { }
): FakeTidder {
  const values = new Map<string, unknown>(Object.entries({
    ...defaultSettings,
    ...settings
  }))
  const watchers = new Map<string, Set<Watcher>>()
  const contextMenuListeners = new Set<ContextMenuListener>()

  return {
    platform: 'linux',
    isDev: false,

    window: {
      close: vi.fn(),
      minimize: vi.fn(),
      maximize: vi.fn()
    },

    openExternal: vi.fn(),
    openPopup: vi.fn(),

    // A download the user cancels, unless a test stubs it
    contextMenu: {
      inspect: vi.fn(),
      copyImage: vi.fn(() => Promise.resolve()),
      writeText: vi.fn(),
      download: vi.fn(() => Promise.resolve(
        { status: 'cancelled' } as TidderDownloadResult)),

      onForwarded: vi.fn((listener: ContextMenuListener) => {
        contextMenuListeners.add(listener)
        return { dispose: () => contextMenuListeners.delete(listener) }
      })
    },

    // Logged out, as if there's no stored session
    auth: {
      login: vi.fn(() => Promise.resolve(null)),
      cancel: vi.fn(),
      refresh: vi.fn(() => Promise.resolve(null)),
      logout: vi.fn(() => Promise.resolve())
    },

    settings: {
      get: vi.fn((key: string) => values.get(key)),

      set: vi.fn((key: string, value: unknown) => {
        values.set(key, value)
        watchers.get(key)?.forEach(watcher => watcher(value))
      }),

      watch: vi.fn((key: string, callback: Watcher) => {
        const forKey = watchers.get(key) ?? new Set()
        watchers.set(key, forKey.add(callback))

        return { dispose: () => forKey.delete(callback) }
      })
    }
  }
}

type Members = Record<string, unknown>

function assignDeep(target: Members, source: Members) {
  for (const [key, value] of Object.entries(source)) {
    const current = target[key]

    if (isObject(value) && isObject(current))
      assignDeep(current, value)
    else
      target[key] = value
  }
}

function isObject(value: unknown): value is Members {
  return typeof value === 'object' && value !== null
}

// Some modules keep a reference to window.tidder or one of
// its parts from when they're imported, so a new fake is
// copied into the objects already installed
export function installFakeTidder(
  settings?: Record<string, unknown>
): FakeTidder {
  const fake = createFakeTidder(settings)

  if (isObject(window.tidder))
    assignDeep(window.tidder, fake)
  else
    window.tidder = fake

  return tidder()
}

// The fake installed for the current test
export function tidder(): FakeTidder {
  return window.tidder as FakeTidder
}
