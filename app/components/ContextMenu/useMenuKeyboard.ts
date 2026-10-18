import { useEffect, useState } from 'react'

import type { ContextMenuItem } from 'core/contextMenu'

interface Handlers {
  onChoose: (item: ContextMenuItem) => void
  onClose: () => void
}

// The open menu's keyboard: the arrows move between enabled
// items, Enter chooses the active one and Escape closes. It
// listens on the document instead of taking focus, so a text
// field keeps its focus and selection while the menu is open.
// Returns the active item's index (null for none), which the
// pointer sets too.
export function useMenuKeyboard(
  items: readonly ContextMenuItem[],
  { onChoose, onClose }: Handlers
) {
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown')
        setActive(step(items, active, 1))
      else if (event.key === 'ArrowUp')
        setActive(step(items, active, -1))
      else if (event.key === 'Enter' && active !== null)
        onChoose(items[active])
      else if (event.key === 'Escape')
        onClose()
      else
        return

      // The key was the menu's: the page doesn't see it
      event.preventDefault()
      event.stopPropagation()
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [items, active, onChoose, onClose])

  return [active, setActive] as const
}

// The next enabled item in the direction, wrapping around;
// from no item, the first or the last
function step(
  items: readonly ContextMenuItem[],
  from: number | null,
  direction: 1 | -1
): number | null {
  const count = items.length
  let index = from ?? (direction === 1 ? -1 : count)

  for (let i = 0; i < count; i++) {
    index = (index + direction + count) % count
    if (!items[index].disabled) return index
  }

  return null
}
