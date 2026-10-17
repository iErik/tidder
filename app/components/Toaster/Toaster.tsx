import { useLayoutEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

import Icon from 'components/Icon/Icon'

import {
  dismissToast,
  FADE_DURATION,
  getToastConfig,
  pauseToast,
  resumeToast,
  useToasts
} from 'core/toasts'
import type { ToastId } from 'core/toasts'
import { useSetting } from 'core/useSetting'
import { bindStyles } from 'utils/classNames'

import styles from './Toaster.module.scss'

const cx = bindStyles(styles)

// The stack of Toasts in the bottom-right corner. Mounted once,
// outside RootLayout, so it shows on the login screen too; it
// sets the theme class itself for that reason.
export default function Toaster() {
  const toasts = useToasts()
  const appTheme = useSetting<string>('appTheme')
  const { newestOnTop } = getToastConfig()

  const hostRef = useRef<HTMLDivElement>(null)
  const elements = useRef(new Map<ToastId, HTMLElement>())
  const positions = useRef(new Map<ToastId, number>())

  // When a Toast arrives or leaves, the others jump to their
  // new places; this moves each one back to where it was and
  // lets the transition glide it to the new place (FLIP).
  useLayoutEffect(() => {
    const hostTop = hostRef.current?.getBoundingClientRect().top ?? 0
    const next = new Map<ToastId, number>()

    for (const [id, element] of elements.current) {
      const top = hostTop + element.offsetTop
      const previous = positions.current.get(id)
      next.set(id, top)

      if (previous === undefined || previous === top) continue

      element.style.transition = 'none'
      element.style.transform = `translateY(${previous - top}px)`
      // Applies the jump back before the transition starts
      element.getBoundingClientRect()
      element.style.transition = ''
      element.style.transform = ''
    }

    positions.current = next
  }, [toasts])

  const fade = { '--fade': `${FADE_DURATION}ms` } as CSSProperties

  return (
    <div
      ref={hostRef}
      className={cx('toaster', `theme-${appTheme}`,
        { 'newest-on-top': newestOnTop })}
      style={fade}
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          ref={(element) => {
            if (element) elements.current.set(item.id, element)
            return () => { elements.current.delete(item.id) }
          }}
          role={item.type === 'error' ? 'alert' : 'status'}
          className={cx('toast', `is-${item.type}`,
            { closing: item.closing })}
          onMouseEnter={() => pauseToast(item.id)}
          onMouseLeave={() => resumeToast(item.id)}
        >
          <Icon name={item.icon} className={cx('type-icon')} />

          <span className={cx('message')}>{item.message}</span>

          <button
            type="button"
            aria-label="Dismiss"
            className={cx('dismiss')}
            onClick={() => dismissToast(item.id)}
          >
            <Icon name="forbidden-2" />
          </button>
        </div>
      ))}
    </div>
  )
}
