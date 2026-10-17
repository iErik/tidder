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

export default function WindowControls() {
  return (
    <div className={cx('window-controls')}>
      <div className={cx('window-controls-inner', platform)}>
        <button
          className={cx('btn btn-maximize')}
          onClick={() => window.tidder.window.maximize()}
        >
          <Icon name={controlIcon('maximize')} />
        </button>
        <button
          className={cx('btn btn-minimize')}
          onClick={() => window.tidder.window.minimize()}
        >
          <Icon name={controlIcon('minimize')} />
        </button>
        <button
          className={cx('btn btn-close')}
          onClick={() => window.tidder.window.close()}
        >
          <Icon name={controlIcon('close')} />
        </button>
      </div>
    </div>
  )
}
