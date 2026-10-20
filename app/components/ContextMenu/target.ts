// What a right-click in the page landed on, which picks the
// menu it opens. Menus are never merged: the most specific
// target wins.

export type MenuTarget =
  // Selected text, right-clicked on the selection itself
  | { type: 'selection'; text: string }
  // Anything else: an image, video, embed or post, or
  // nowhere in particular. The page's own components open
  // those menus, or the default one opens.
  | { type: 'page' }

export interface RightClick {
  // What the main process reports for it
  params: TidderContextMenuParams

  // Whether it landed on the selected text (isOnSelection)
  onSelection: boolean
}

// The target, from the most specific down. A text field and
// a link rank above the selection.
export function pickTarget(
  { params, onSelection }: RightClick
): MenuTarget {
  if (onSelection && params.selectionText)
    return { type: 'selection', text: params.selectionText }

  return { type: 'page' }
}

// Whether the point, in CSS pixels, is on the selected text
export function isOnSelection(x: number, y: number): boolean {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return false

  for (let i = 0; i < selection.rangeCount; i++) {
    const rects = selection.getRangeAt(i).getClientRects()

    for (const rect of rects) {
      if (x >= rect.left && x <= rect.right
        && y >= rect.top && y <= rect.bottom)
        return true
    }
  }

  return false
}
