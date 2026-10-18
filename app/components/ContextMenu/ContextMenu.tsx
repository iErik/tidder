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

import { defaultMenuItems } from './menus'
import { placeMenu } from './placeMenu'
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

// A right-click at the point, as if it had happened on the
// page's element there
function replayRightClick(x: number, y: number) {
  const target = document.elementFromPoint(x, y) ?? document.body

  target.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y
  }))
}

// A component opens its own menu from onContextMenu. Before
// any component sees a right-click, it's cancelled here, so
// the native menu never shows, even when a component stops
// the event; and the right button's mousedown is too, so it
// doesn't move the focus, caret or selection. A right-click
// that opened no menu on its way up opens the default one.
//
// A right-click inside an embed's iframe never reaches the
// page; the main process forwards it, and it's replayed on
// the iframe, so the component around it can open its menu
// like for any other right-click.
function useDefaultMenu() {
  useEffect(() => {
    // The menu open when the current right-click started
    let before: Menu | null = null

    function onMouseDown(event: MouseEvent) {
      if (event.button === 2) event.preventDefault()
    }

    function cancel(event: MouseEvent) {
      event.preventDefault()
      before = getContextMenu()
    }

    function onContextMenu(event: MouseEvent) {
      if (getContextMenu() === before)
        openDefaultMenu(event.clientX, event.clientY)
    }

    const forwarded = window.tidder.contextMenu
      .onForwarded(({ isSubframe, x, y }) => {
        if (isSubframe) replayRightClick(x, y)
      })

    const capture = { capture: true }
    window.addEventListener('mousedown', onMouseDown, capture)
    window.addEventListener('contextmenu', cancel, capture)
    document.addEventListener('contextmenu', onContextMenu)

    return () => {
      window.removeEventListener('mousedown', onMouseDown, capture)
      window.removeEventListener('contextmenu', cancel, capture)
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
