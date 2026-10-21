import { useRef, useState } from 'react'

import Icon from 'components/Icon/Icon'

import themesConfig from 'config/themes.json'

import { setSetting } from 'core/useSetting'
import { useDismiss } from 'hooks/useDismiss'
import { bindStyles } from 'utils/classNames'

import styles from './ThemePicker.module.scss'

const cx = bindStyles(styles)
const themes = Object.keys(themesConfig.appThemes || { })

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)')
    .matches
}

function titleCase(text: string): string {
  return text.replace(/\w\S*/g, (word) =>
    word[0].toUpperCase() + word.slice(1).toLowerCase())
}

export default function ThemePicker() {
  // 'closing' keeps the menu mounted while it fades out.
  const [menu, setMenu] = useState<
    'closed' |
    'open' |
    'closing'
  >('closed')

  // With reduced motion there's no fade-out to wait for
  const close = () =>
    setMenu(reducedMotion() ? 'closed' : 'closing')

  // The whole picker counts as inside, so a mousedown on the
  // trigger leaves the toggling to its click
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, close, menu === 'open')

  const toggleMenu = () => {
    if (menu === 'open') close()
    else setMenu('open')
  }

  const changeTheme = (theme: string) => {
    close()
    setSetting('appTheme', theme)
  }

  return (
    <div
      ref={ref}
      className={cx('theme-picker')}
    >
      <div className={cx('layout')}>
        <div className={cx('toggle')}>
          <button
            type="button"
            aria-label="Choose theme"
            aria-expanded={menu === 'open'}
            className={cx('trigger')}
            onClick={toggleMenu}
          >
            <Icon name="arrow-down-o" />
          </button>
        </div>

        {menu !== 'closed' && (
          <div
            className={cx(
              'dropdown',
              menu === 'open' ? '-entering' : '-leaving'
            )}
            onAnimationEnd={() => {
              if (menu === 'closing') setMenu('closed')
            }}
          >
            <div className={cx('heading')}>
              <p className={cx('title')}>Themes</p>
            </div>
            <ul className={cx('entries')}>
              {themes.map((theme) => (
                <li
                  key={theme}
                  className={cx(
                    'entry',
                    `theme-${theme}`
                  )}
                  onClick={() => changeTheme(theme)}
                >
                  {titleCase(theme)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
