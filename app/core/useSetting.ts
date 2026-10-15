import { useCallback, useSyncExternalStore } from 'react'

const settings = window.tidder.settings

// A setting from the main process's settings store (electron/settings.js),
// re-rendering whenever it changes.
export function useSetting<T = unknown>(key: string): T {
  const subscribe = useCallback((onChange: () => void) => {
    const watcher = settings.watch(key, onChange)
    return () => watcher.dispose()
  }, [key])

  return useSyncExternalStore(subscribe, () => settings.get(key) as T)
}

export function setSetting(key: string, value: unknown): void {
  settings.set(key, value)
}
