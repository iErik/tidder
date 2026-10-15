import { matchPath, useLocation } from 'react-router'

import Icon from 'components/Icon/Icon'
import ThemePicker from 'components/ThemePicker/ThemePicker'
import WindowControls from 'components/WindowControls/WindowControls'

import { login, logout, useAuth } from 'core/auth'
import { bindStyles } from 'utils/classNames'

import styles from './Topbar.module.scss'

const cx = bindStyles(styles)

function pageLabel(pathname: string): string {
  const sr = matchPath('/r/:subredditName', pathname)
  const multi = matchPath(
    '/user/:userName/m/:multiName',
    pathname
  )

  if (sr)
    return `r/${sr.params.subredditName!.toUpperCase()}`
  if (multi)
    return `m/${multi.params.multiName!.toUpperCase()}`

  return 'FRONTPAGE'
}

interface Props {
  onSidebarToggle: () => void
}

export default function Topbar({ onSidebarToggle }: Props) {
  const { loggedIn, user } = useAuth()
  const { pathname } = useLocation()

  return (
    <div className={cx('host')}>
      <div className={cx('section section-left')}>
        <div className={cx('topbar-controls')}>
          <div className={cx('topbar-control')}>
            <button
              type="button"
              className={cx('btn-trigger')}
              onClick={onSidebarToggle}
            >
              <Icon name="menu" />
            </button>
          </div>
          <div className={cx('topbar-control')}>
            <ThemePicker />
          </div>
        </div>
      </div>

      <div className={cx('page-label')}>
        <span className={cx('label')}>
          {loggedIn ? pageLabel(pathname) : 'TIDDER'}
        </span>
      </div>

      <div className={cx('section section-right')}>
        <div className={cx('user-links')}>
          {!loggedIn && (
            <div className={cx('links')}>
              <div className={cx('login-link')}>
                <button
                  className={cx('link-btn')}
                  onClick={login}
                >
                  Log in
                </button>
              </div>
            </div>
          )}

          {loggedIn && (
            <div className={cx('links')}>
              <div className={cx('user-meta')}>
                <p>Welcome, {user?.name}</p>
              </div>
              <div className={cx('login-link')}>
                <button
                  className={cx('link-btn')}
                  onClick={logout}
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={cx('wrapper-window-controls')}>
          <WindowControls />
        </div>
      </div>
    </div>
  )
}
