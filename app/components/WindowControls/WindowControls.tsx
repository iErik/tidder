import Icon, { type IconName } from 'components/Icon/Icon'

import {
  useWindowMaximized
} from 'hooks/useWindowMaximized'
import { bindStyles } from 'utils/classNames'

import styles from './WindowControls.module.scss'

const cx = bindStyles(styles)
const platform = window.tidder.platform

// Maximize turns into restore while the window is maximized
type Control = 'maximize' | 'unmaximize' | 'minimize' | 'close'

// macOS has its own icons, drawn inside the traffic lights.
function controlIcon(control: Control): IconName {
  return platform === 'darwin' ? `${control}-darwin` : control
}

// The action each control's button announces
const labels: Record<Control, string> = {
  maximize: 'Maximize window',
  unmaximize: 'Restore window',
  minimize: 'Minimize window',
  close: 'Close window'
}

export default function WindowControls() {
  const maximized = useWindowMaximized()
  const resize = maximized ? 'unmaximize' : 'maximize'

  return (
    <div className={cx('window-controls')}>
      <div className={cx('window-controls-inner', platform)}>
        <button
          aria-label={labels[resize]}
          className={cx('btn btn-maximize')}
          onClick={() => window.tidder.window.toggleMaximize()}
        >
          <Icon name={controlIcon(resize)} />
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
