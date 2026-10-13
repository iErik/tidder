import { useEffect, useRef, type RefObject } from 'react';

// Calls `onEnd` when `sentinel` (an element placed after the list) comes
// within `margin` pixels of the bottom of the scrolling `container`.
export function useInfiniteScroll(
  container: RefObject<HTMLElement | null>,
  sentinel: RefObject<HTMLElement | null>,
  onEnd: () => void,
  { disabled = false, margin = 600 } = { }
): void {
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    if (disabled || !container.current || !sentinel.current) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) onEndRef.current(); },
      { root: container.current, rootMargin: `0px 0px ${margin}px 0px` });

    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [container, sentinel, disabled, margin]);
}
