import { useEffect, useRef, type RefObject } from 'react'

// Calls `onEnd` when `sentinel` (an element placed after the list) comes
// within `margin` pixels of the bottom of the scrolling `container`.
export function useInfiniteScroll(
  container: RefObject<HTMLElement | null>,
  sentinel: RefObject<HTMLElement | null>,
  onEnd: () => void,
  { disabled = false, margin = 600 } = { }
): void {
  const onEndRef = useRef(onEnd)
  // eslint-disable-next-line react-hooks/refs -- keeps the observer calling the latest onEnd without re-creating it; useEffectEvent would be a refactor
  onEndRef.current = onEnd

  useEffect(() => {
    if (disabled || !container.current || !sentinel.current) return

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) onEndRef.current() },
      { root: container.current, rootMargin: `0px 0px ${margin}px 0px` })

    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [container, sentinel, disabled, margin])
}
