export interface Size {
  width: number
  height: number
}

// Where the menu's top-left corner goes for a right-click at
// x, y: below and to the right of the point, flipped to the
// left or upwards where it would leave the window, and kept
// inside it when it fits neither way.
export function placeMenu(
  x: number,
  y: number,
  menu: Size,
  viewport: Size
): { left: number; top: number } {
  return {
    left: place(x, menu.width, viewport.width),
    top: place(y, menu.height, viewport.height)
  }
}

function place(point: number, size: number, limit: number) {
  if (point + size <= limit) return point
  if (point - size >= 0) return point - size

  return Math.max(0, limit - size)
}
