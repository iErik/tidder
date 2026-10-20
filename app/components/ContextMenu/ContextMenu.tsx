import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef
} from 'react'
import type { RefObject } from 'react'

import {
  closeContextMenu,
  getContextMenu,
  openContextMenu,
  useContextMenu
} from 'core/contextMenu'
import type {
  ContextMenu as Menu,
  ContextMenuItem
} from 'core/contextMenu'
import { useSetting } from 'core/useSetting'
import { bindStyles } from 'utils/classNames'

import { defaultMenuItems, targetMenuItems } from './menus'
import { placeMenu } from './placeMenu'
import { isOnSelection, pickTarget } from './target'
import type { MenuTarget } from './target'
import { useMenuKeyboard } from './useMenuKeyboard'

import styles from './ContextMenu.module.scss'

const cx = bindStyles(styles)

// The app's context menu, drawn in place of the native one.
// Mounted once, outside RootLayout like the Toaster, so it
// sets the theme class itself. It also opens the default menu
// wherever no component opened one of its own.
export default function ContextMenu() {
  const menu = useContextMenu()

  useDefaultMenu()

  // A new menu remounts the list, which starts with no
  // active item
  return menu && <MenuList key={menu.id} menu={menu} />
}

function openDefaultMenu(x: number, y: number) {
  openContextMenu(x, y, defaultMenuItems(x, y))
}

// The right-clicks replayRightClick dispatched
const replayed = new WeakSet<Event>()

// A right-click at the point, as if it had happened on the
// page's element there
function replayRightClick(x: number, y: number) {
  const target = document.elementFromPoint(x, y) ?? document.body
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y
  })

  replayed.add(event)
  target.dispatchEvent(event)
}

// Opens the menu for a right-click the main process
// forwarded, once it reports what it landed on. One inside an
// embed's iframe, or on nothing pickTarget ranks above the
// page's own menus, is replayed on the element at the point.
function onForwarded(params: TidderContextMenuParams) {
  const { x, y } = params
  const target: MenuTarget = params.isSubframe
    ? { type: 'page' }
    : pickTarget({ params, onSelection: isOnSelection(x, y) })

  if (target.type === 'page') replayRightClick(x, y)
  else openContextMenu(x, y, targetMenuItems(target, x, y))
}

// The input types that take text
const TEXT_INPUTS = new Set([
  'text', 'search', 'url', 'tel', 'email', 'password', 'number'
])

// The text field the element is in, if any: an input that
// takes text, a textarea or another editable
function fieldAt(element: EventTarget | null): HTMLElement | null {
  if (!(element instanceof Element)) return null

  const field = element.closest('input, textarea, [contenteditable]')

  if (field instanceof HTMLInputElement)
    return TEXT_INPUTS.has(field.type) ? field : null

  if (field instanceof HTMLTextAreaElement) return field

  return field instanceof HTMLElement && field.isContentEditable
    ? field
    : null
}

// The right button's mousedown is cancelled, so it doesn't
// move the focus, caret or selection. Except on a text field
// without focus: it takes the focus, and the caret goes where
// the right-click landed, as with a native menu. The field's
// edit flags, and the edit commands, which act on the focused
// field, then apply to the one right-clicked.
function onRightMouseDown(event: MouseEvent) {
  const field = fieldAt(event.target)

  if (field && field !== document.activeElement) {
    field.focus()
    if (field === document.activeElement) return
  }

  event.preventDefault()
}

// A right-click opens no menu until the main process reports
// what it landed on (see onForwarded). Until then, it's
// stopped before any component sees it, but not cancelled, or
// Electron wouldn't report it. Its mousedown comes first (see
// onRightMouseDown).
//
// A component opens its own menu from onContextMenu, when the
// right-click is replayed on it. A replayed right-click that
// opened no menu on its way up opens the default one.
function useDefaultMenu() {
  useEffect(() => {
    // The menu open when the current replay started
    let before: Menu | null = null

    function onMouseDown(event: MouseEvent) {
      if (event.button === 2) onRightMouseDown(event)
    }

    function hold(event: MouseEvent) {
      if (!replayed.has(event)) {
        event.stopImmediatePropagation()
        return
      }

      event.preventDefault()
      before = getContextMenu()
    }

    function onContextMenu(event: MouseEvent) {
      if (getContextMenu() === before)
        openDefaultMenu(event.clientX, event.clientY)
    }

    const forwarded = window.tidder.contextMenu
      .onForwarded(onForwarded)

    const capture = { capture: true }
    window.addEventListener('mousedown', onMouseDown, capture)
    window.addEventListener('contextmenu', hold, capture)
    document.addEventListener('contextmenu', onContextMenu)

    return () => {
      window.removeEventListener('mousedown', onMouseDown, capture)
      window.removeEventListener('contextmenu', hold, capture)
      document.removeEventListener('contextmenu', onContextMenu)
      forwarded.dispose()
    }
  }, [])
}

function choose(item: ContextMenuItem) {
  if (item.disabled) return

  closeContextMenu()
  item.action()
}

function MenuList({ menu }: { menu: Menu }) {
  const appTheme = useSetting<string>('appTheme')
  const ref = useRef<HTMLUListElement>(null)
  const idPrefix = useId()
  const [active, setActive] = useMenuKeyboard(menu.items, {
    onChoose: choose,
    onClose: closeContextMenu
  })

  // Placed once its size is known, before it's painted
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const { left, top } = placeMenu(
      menu.x, menu.y,
      { width: element.offsetWidth, height: element.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight }
    )

    element.style.left = `${left}px`
    element.style.top = `${top}px`
  }, [menu])

  useCloseTriggers(ref)

  const itemId = (index: number) => `${idPrefix}-item-${index}`

  return (
    <ul
      ref={ref}
      role="menu"
      aria-activedescendant={active === null ? undefined : itemId(active)}
      className={cx('context-menu', `theme-${appTheme}`)}
      // Keeps the focus and the selection where they were
      onMouseDown={(event) => event.preventDefault()}
      // A right-click on the menu opens no other menu
      onContextMenu={(event) => event.stopPropagation()}
    >
      {menu.items.map((item, index) => (
        <li
          key={index}
          id={itemId(index)}
          role="menuitem"
          aria-disabled={item.disabled || undefined}
          className={cx('item', {
            'is-active': index === active,
            'is-disabled': item.disabled
          })}
          onMouseEnter={() => setActive(item.disabled ? null : index)}
          onMouseLeave={() => setActive(null)}
          onClick={() => choose(item)}
        >
          {item.label}
        </li>
      ))}
    </ul>
  )
}

// Closes the menu on a click outside it, scrolling, resizing
// the window, or the window losing focus
function useCloseTriggers(
  ref: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node))
        closeContextMenu()
    }

    const options = { capture: true }
    document.addEventListener('mousedown', onMouseDown, options)
    window.addEventListener('scroll', closeContextMenu, options)
    window.addEventListener('resize', closeContextMenu)
    window.addEventListener('blur', closeContextMenu)

    return () => {
      document.removeEventListener('mousedown', onMouseDown, options)
      window.removeEventListener('scroll', closeContextMenu, options)
      window.removeEventListener('resize', closeContextMenu)
      window.removeEventListener('blur', closeContextMenu)
    }
  }, [ref])
}
