import { redditUrl } from 'utils/redditUrl'

// What a right-click in the page landed on, which picks the
// menu it opens. Menus are never merged: the most specific
// target wins.

// What a text field's edit commands can do there
export type EditFlags = TidderContextMenuParams['editFlags']

// A link, at its absolute URL (see redditUrl), with its own
// text, and the selected text when the right-click is on the
// selection
export interface LinkTarget {
  type: 'link'
  url: string
  linkText: string
  selection?: string
}

export type MenuTarget =
  // A text field (input, textarea or other editable)
  | { type: 'field'; editFlags: EditFlags }
  | LinkTarget
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

  // The text field it landed on (fieldAt), if any
  field: HTMLElement | null
}

// The target, from the most specific down. A text field and
// a link rank above the selection.
export function pickTarget(
  { params, onSelection, field }: RightClick
): MenuTarget {
  // Electron reports a read-only field as not editable, but
  // it still gets the field's menu, without Cut and Paste
  if (field && isReadOnly(field)) {
    return {
      type: 'field',
      editFlags: {
        ...params.editFlags,
        canCut: false,
        canPaste: false
      }
    }
  }

  if (field || params.isEditable)
    return { type: 'field', editFlags: params.editFlags }

  const selectedText = onSelection ? params.selectionText : ''

  // A link to the app's own page (href="#") is a button
  const url = params.linkURL && redditUrl(params.linkURL)
  if (url) {
    return {
      type: 'link',
      url,
      linkText: params.linkText,
      selection: selectedText || undefined
    }
  }

  if (selectedText) return { type: 'selection', text: selectedText }

  return { type: 'page' }
}

// The input types that take text
const TEXT_INPUTS = new Set([
  'text', 'search', 'url', 'tel', 'email', 'password', 'number'
])

// The text field the element is in, if any: an input that
// takes text, a textarea or another editable
export function fieldAt(
  element: EventTarget | null
): HTMLElement | null {
  if (!(element instanceof Element)) return null

  const field = element.closest(
    'input, textarea, [contenteditable]'
  )

  if (field instanceof HTMLInputElement)
    return TEXT_INPUTS.has(field.type) ? field : null

  if (field instanceof HTMLTextAreaElement) return field

  return field instanceof HTMLElement && field.isContentEditable
    ? field
    : null
}

function isReadOnly(field: HTMLElement): boolean {
  return (field instanceof HTMLInputElement
    || field instanceof HTMLTextAreaElement)
    && (field.readOnly || field.disabled)
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
