import { useState } from 'react'

import Icon from 'components/Icon/Icon'

import themesConfig from 'config/themes.json'

import { setSetting } from 'core/useSetting'
import { bindStyles } from 'utils/classNames'

import styles from './ThemePicker.module.scss'

const cx = bindStyles(styles)
const themes = Object.keys(themesConfig.appThemes || { })

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

  const toggleMenu = () => setMenu(menu === 'open'
    ? 'closing'
    : 'open')

  const changeTheme = (theme: string) => {
    setMenu('closing')
    setSetting('appTheme', theme)
  }

  return (
    <div className={cx('theme-picker')}>
      <div className={cx('theme-picker-layout')}>
        <div className={cx('theme-picker-toggle')}>
          <button
            type="button"
            className={cx('btn-trigger')}
            onClick={toggleMenu}
          >
            <Icon name="arrow-down-o" />
          </button>
        </div>

        {menu !== 'closed' && (
          <div
            className={cx(
              'theme-picker-menu',
              menu === 'open' ? 'fade-enter' : 'fade-leave'
            )}
            onAnimationEnd={() => {
              if (menu === 'closing') setMenu('closed')
            }}
          >
            <div className={cx('menu-heading')}>
              <p className={cx('heading')}>Themes</p>
            </div>
            <ul className={cx('theme-picker-entries')}>
              {themes.map((theme) => (
                <li
                  key={theme}
                  className={cx(
                    'theme-picker-entry',
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
