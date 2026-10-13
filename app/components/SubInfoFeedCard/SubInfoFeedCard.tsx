import { Link } from 'react-router';

import { setSubscribed, useThing } from 'api/thingState';
import type { Subreddit } from 'api/types';

import { bindStyles } from 'utils/classNames';
import { timeAgo } from 'utils/timeAgo';

import styles from './SubInfoFeedCard.module.scss';

const cx = bindStyles(styles);

interface Props {
  subInfo: Subreddit;
}

export default function SubInfoFeedCard({ subInfo: rawSubInfo }: Props) {
  const subInfo = useThing(rawSubInfo);

  return (
    <div className={cx('host')}>
      <div className={cx('card-thumbnail')}>
        <span
          className={cx('thumbnail', { 'is-static': !subInfo.icon_img })}
          style={{ backgroundImage: `url(${subInfo.icon_img})` }}>
          {!subInfo.icon_img && <i className={cx('icn')}></i>}
        </span>
      </div>

      <div className={cx('card-contents')}>
        <div className={cx('card-title')}>
          <Link to={subInfo.url} className={cx('card-link')}>
            {subInfo.title}
          </Link>
        </div>

        <div className={cx('card-meta')}>
          <p className={cx('meta')}>
            <span className={cx('meta-link')}>
              <Link to={subInfo.url} className={cx('link bold-text')}>
                {subInfo.display_name_prefixed}
              </Link>
            </span>{' '}
            <span className={cx('meta-info')}>
              {subInfo.subscribers.toLocaleString()} subscribers, a community for{' '}
              {timeAgo(subInfo.created_utc * 1000, true)}
            </span>
          </p>
        </div>

        <div className={cx('card-description')}>
          <p className={cx('description')}>
            {subInfo.public_description}
          </p>
        </div>
      </div>

      <div className={cx('card-actions')}>
        <div className={cx('card-action')}>
          <button
            onClick={() => setSubscribed(subInfo, !subInfo.user_is_subscriber)}
            className={cx('btn-action', { 'is-checked': subInfo.user_is_subscriber })}>

            <i className={subInfo.user_is_subscriber ? 'icn-check' : 'icn-plus'}></i>
          </button>
        </div>
      </div>
    </div>
  );
}
