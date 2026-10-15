import { bindStyles } from 'utils/classNames'

import styles from './WindowControls.module.scss'

const cx = bindStyles(styles)
const platform = window.tidder.platform

function iconClass(icon: string): string {
  return platform === 'darwin' ? `icn-${icon}-darwin` : `icn-${icon}`
}

export default function WindowControls() {
  return (
    <div className={cx('host')}>
      <div className={cx('window-controls', platform)}>
        <button
          className={cx('btn btn-maximize')}
          onClick={() => window.tidder.window.maximize()}
        >
          <i className={iconClass('maximize')}></i>
        </button>
        <button
          className={cx('btn btn-minimize')}
          onClick={() => window.tidder.window.minimize()}
        >
          <i className={iconClass('minimize')}></i>
        </button>
        <button
          className={cx('btn btn-close')}
          onClick={() => window.tidder.window.close()}
        >
          <i className={iconClass('close')}></i>
        </button>
      </div>
    </div>
  )
}
