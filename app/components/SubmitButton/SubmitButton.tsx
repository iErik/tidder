import type { ReactNode } from 'react';

import { bindStyles } from 'utils/classNames';

import styles from './SubmitButton.module.scss';

const cx = bindStyles(styles);

interface Props {
  children: ReactNode;
  spinnerType?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  outline?: boolean;
  onClick?(): void;
}

export default function SubmitButton(
  { children, spinnerType = 'round-spinner', isDisabled, isLoading, outline, onClick }: Props
) {
  return (
    <div className={cx('host')}>
      <button type="submit"
        className={cx('button', { outline, 'is-loading': isLoading })}
        disabled={isDisabled}
        onClick={onClick}>

        {isLoading && (
          <div className={cx('wrapper-spinner')}>
            <div className={cx('spinner', spinnerType)}></div>
          </div>
        )}
        <div className={cx('contents')}>
          {children}
        </div>
      </button>
    </div>
  );
}
