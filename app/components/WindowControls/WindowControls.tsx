import Icon, { type IconName } from 'components/Icon/Icon'

import { bindStyles } from 'utils/classNames'

import styles from './WindowControls.module.scss'

const cx = bindStyles(styles)
const platform = window.tidder.platform

type Control = 'maximize' | 'minimize' | 'close'

// macOS has its own icons, drawn inside the traffic lights.
function controlIcon(control: Control): IconName {
  return platform === 'darwin' ? `${control}-darwin` : control
}

// The action each control's button announces
const labels: Record<Control, string> = {
  maximize: 'Maximize window',
  minimize: 'Minimize window',
  close: 'Close window'
}

export default function WindowControls() {
  return (
    <div className={cx('window-controls')}>
      <div className={cx('window-controls-inner', platform)}>
        <button
          aria-label={labels.maximize}
          className={cx('btn btn-maximize')}
          onClick={() => window.tidder.window.maximize()}
        >
          <Icon name={controlIcon('maximize')} />
        </button>
        <button
          aria-label={labels.minimize}
          className={cx('btn btn-minimize')}
          onClick={() => window.tidder.window.minimize()}
        >
          <Icon name={controlIcon('minimize')} />
        </button>
        <button
          aria-label={labels.close}
          className={cx('btn btn-close')}
          onClick={() => window.tidder.window.close()}
        >
          <Icon name={controlIcon('close')} />
        </button>
      </div>
    </div>
  )
}
