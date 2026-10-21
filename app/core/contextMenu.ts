import { createStore } from 'core/createStore'

// The context menu: at most one open at a time, at the point
// that was right-clicked. A module-level store, like the
// Toasts, so any component (or the default menu) can open it;
// the ContextMenu component renders it.

export interface ContextMenuItem {
  label: string
  disabled?: boolean
  action: () => void
}

export interface ContextMenu {
  // A new one for each menu opened, so the component starts
  // fresh even when a menu replaces another
  id: number
  x: number
  y: number
  items: readonly ContextMenuItem[]
}

const menu = createStore<ContextMenu | null>(null)
let nextId = 1

export function useContextMenu(): ContextMenu | null {
  return menu.useStore()
}

// The open menu, outside React
export function getContextMenu(): ContextMenu | null {
  return menu.get()
}

// Replaces any menu already open. With no items, nothing
// opens, and the open menu still closes.
export function openContextMenu(
  x: number,
  y: number,
  items: readonly ContextMenuItem[]
): void {
  menu.set(items.length ? { id: nextId++, x, y, items } : null)
}

export function closeContextMenu(): void {
  if (menu.get()) menu.set(null)
}
