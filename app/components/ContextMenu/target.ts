import { redditUrl } from 'utils/redditUrl'

// What a right-click in the page landed on, which picks the
// menu it opens. Menus are never merged: the most specific
// target wins.

export type MenuTarget =
  // A link, at its absolute URL (see redditUrl). `text` is
  // the link's, or the whole selection when the right-click
  // is on one.
  | { type: 'link'; url: string; text: string }
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
  const selection = onSelection ? params.selectionText : ''

  // A link to the app's own page (href="#") is a button
  const url = params.linkURL && redditUrl(params.linkURL)
  if (url)
    return { type: 'link', url, text: selection || params.linkText }

  if (selection) return { type: 'selection', text: selection }

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
