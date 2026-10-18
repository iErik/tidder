import type { ContextMenuItem } from 'core/contextMenu'

// The items each menu shows. Plain functions of what was
// right-clicked, so they can be tested without rendering.

// The items, plus Inspect at the point in dev mode only
export function withInspect(
  items: readonly ContextMenuItem[],
  x: number,
  y: number
): ContextMenuItem[] {
  if (!window.tidder.isDev) return [...items]

  return [...items, {
    label: 'Inspect',
    action: () => window.tidder.contextMenu.inspect(x, y)
  }]
}

// Anywhere no component has its own menu for
export function defaultMenuItems(
  x: number,
  y: number
): ContextMenuItem[] {
  return withInspect([], x, y)
}
