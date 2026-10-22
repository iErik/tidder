import { useState, type UIEvent } from 'react'

// Whether an element is scrolled down from its top. Give it
// `onScroll`. While `reset` is true (its element is being
// replaced), `scrolled` goes back to false.
export function useScrolled(reset = false) {
  const [scrolled, setScrolled] = useState(false)

  // Adjusting state during render, so a new element starts
  // unscrolled
  if (reset && scrolled) setScrolled(false)

  // Only sets the state when it flips, so scrolling further
  // doesn't re-render
  const onScroll = (event: UIEvent<HTMLElement>) => {
    const next = event.currentTarget.scrollTop > 0
    if (next !== scrolled) setScrolled(next)
  }

  return { scrolled, onScroll }
}
