import {
  useEffect,
  useEffectEvent,
  type RefObject
} from 'react'

// While `enabled`, calls `onDismiss` on a mousedown outside
// `ref` (any button) or on Escape. The listeners are only on
// the document while it's enabled. Mousedown is caught in the
// capture phase, so an element that stops its propagation
// still dismisses.
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  enabled: boolean
): void {
  const dismiss = useEffectEvent(onDismiss)

  useEffect(() => {
    if (!enabled) return

    function onMouseDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node))
        dismiss()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') dismiss()
    }

    document.addEventListener('mousedown', onMouseDown, true)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onMouseDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, enabled])
}
