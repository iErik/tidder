import type { ReactNode } from 'react'

import { bindStyles } from 'utils/classNames'

import styles from './SplitButton.module.scss'

const cx = bindStyles(styles)

interface Props {
  buttonLabel: string
  className?: string
  icon?: ReactNode
}

export default function SplitButton({ buttonLabel, className, icon }: Props) {
  return (
    <div className={cx('split-button', className)}>
      <div className={cx('split-btn-left')}>
        <span className={cx('label')}>
          {buttonLabel}
        </span>
      </div>

      <div className={cx('split-btn-right')}>
        {icon}
      </div>
    </div>
  )
}
