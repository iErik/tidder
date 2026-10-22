import {
  useEffect,
  useState
} from 'react'

// Whether the window is maximized, as the main process
// reports it: false until it answers, then every change,
// made through the window controls or not (double-clicking
// the title area, OS shortcuts, snapping).
export function useWindowMaximized(): boolean {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    const bridge = window.tidder.window

    // The answer is stale once a change has arrived (the
    // change is newer), or after unmount
    let stale = false

    const subscription = bridge.onMaximizedChange((value) => {
      stale = true
      setMaximized(value)
    })

    void bridge.isMaximized().then((value) => {
      if (!stale) setMaximized(value)
    })

    return () => {
      stale = true
      subscription.dispose()
    }
  }, [])

  return maximized
}
