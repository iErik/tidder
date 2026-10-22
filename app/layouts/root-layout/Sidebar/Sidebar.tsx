import { Link } from 'react-router'

import { useMultis, useSubscriptions } from 'api/queries'

import { bindStyles } from 'utils/classNames'

import styles from './Sidebar.module.scss'

const cx = bindStyles(styles)

interface Props {
  isActive: boolean
}

// Only shown while logged in.
export default function Sidebar({ isActive }: Props) {
  const multis = useMultis().data ?? []
  const subscriptions = useSubscriptions()
  const subs = subscriptions.data?.pages.flatMap((page) => page.children) ?? []

  const loadMoreSubs = () => {
    if (subscriptions.hasNextPage && !subscriptions.isFetchingNextPage)
      void subscriptions.fetchNextPage()
  }

  return (
    <div className={cx('sidebar', { 'is-active': isActive })}>
      <ul className={cx('sidebar-layout')}>

        <li className={cx('sidebar-section')}>
          <div className={cx('sidebar-section-entries-container')}>
            <ul className={cx('sidebar-section-entries')}>
              <li className={cx('sidebar-section-entry')}>
                <Link className={cx('entry-link')} to="/">
                  Frontpage
                </Link>
              </li>
              <li className={cx('sidebar-section-entry')}>
                <Link className={cx('entry-link')} to="/saved">
                  Saved
                </Link>
              </li>
              <li className={cx('sidebar-section-entry')}>
                <Link className={cx('entry-link')} to="/hidden">
                  Hidden
                </Link>
              </li>
              <li className={cx('sidebar-section-entry')}>
                <Link className={cx('entry-link')} to="/r/popular">
                  Popular
                </Link>
              </li>
              <li className={cx('sidebar-section-entry')}>
                <Link className={cx('entry-link')} to="/r/all">
                  All Posts
                </Link>
              </li>
            </ul>
          </div>

          <hr className={cx('sidebar-section-separator')} />
        </li>

        <li className={cx('sidebar-section')}>
          <div className={cx('sidebar-section-header-container')}>
            <span className={cx('sidebar-section-header')}>
              My Multireddits
            </span>
          </div>

          <div className={cx('sidebar-section-entries-container')}>
            <ul className={cx('sidebar-section-sub-entries')}>
              {multis.map((multi) => (
                <li
                  key={multi.path}
                  className={cx('sidebar-section-sub-entry')}
                >
                  <Link to={multi.path} className={cx('sub-link')}>
                    <span className={cx('sub-prefix')}>m/</span>
                    <span className={cx('sub-name')}>{multi.display_name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <hr className={cx('sidebar-section-separator')} />
        </li>

        <li className={cx('sidebar-section')}>
          <div className={cx('sidebar-section-header-container')}>
            <span className={cx('sidebar-section-header')}>
              My Subreddits
            </span>
          </div>

          <div className={cx('sidebar-section-entries-container')}>
            <ul className={cx('sidebar-section-sub-entries')}>
              {subs.map((sub) => (
                <li key={sub.name} className={cx('sidebar-section-sub-entry')}>
                  <Link to={sub.url} className={cx('sub-link')}>
                    <span className={cx('sub-prefix')}>r/</span>
                    <span className={cx('sub-name')}>{sub.display_name}</span>
                  </Link>
                </li>
              ))}

              {subscriptions.hasNextPage && (
                <li
                  onClick={loadMoreSubs}
                  className={cx('sub-entry pagination')}
                >
                  <span className={cx('label')}>Load more&hellip;</span>
                </li>
              )}
            </ul>
          </div>
        </li>
      </ul>
    </div>
  )
}
