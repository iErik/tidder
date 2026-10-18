import { useSyncExternalStore } from 'react'

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

let menu: ContextMenu | null = null
let nextId = 1

const listeners = new Set<() => void>()

function setMenu(next: ContextMenu | null): void {
  menu = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useContextMenu(): ContextMenu | null {
  return useSyncExternalStore(subscribe, () => menu)
}

// Replaces any menu already open. With no items, nothing
// opens, and the open menu still closes.
export function openContextMenu(
  x: number,
  y: number,
  items: readonly ContextMenuItem[]
): void {
  setMenu(items.length ? { id: nextId++, x, y, items } : null)
}

export function closeContextMenu(): void {
  if (menu) setMenu(null)
}
