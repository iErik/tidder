import { cancelLogin, login, useAuth } from 'core/auth'
import { bindStyles } from 'utils/classNames'

import styles from './LoginScreen.module.scss'

const cx = bindStyles(styles)

export default function LoginScreen() {
  const status = useAuth().loginStatus

  return (
    <div className={cx('host')}>
      <div className={cx('login-prompt')}>
        <h1 className={cx('heading')}>Sign in to Reddit</h1>

        {status.state !== 'waiting' && (
          <>
            <button type="button" className={cx('btn-login')} onClick={login}>
              Login in the browser
            </button>

            {status.state === 'error' && (
              <p className={cx('login-error')}>
                {status.message}
              </p>
            )}
          </>
        )}

        {status.state === 'waiting' && (
          <>
            <p className={cx('login-waiting')}>
              Finish logging in in your browser
            </p>

            <div className={cx('login-actions')}>
              <button type="button" className={cx('btn-link')} onClick={login}>
                Open again
              </button>
              <button
                type="button"
                className={cx('btn-link')}
                onClick={cancelLogin}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
