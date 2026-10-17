import SearchBar from 'components/SearchBar/SearchBar'
import type { FeedAction } from 'pages/FeedPage/FeedPage'
import { useFeedState } from 'pages/FeedPage/FeedContext'

import { bindStyles } from 'utils/classNames'

import styles from './PostFeedFilters.module.scss'

const cx = bindStyles(styles)

const FEED_SORTS = [
  ['hot', 'Hot'],
  ['top', 'Top'],
  ['new', 'New'],
  ['rising', 'Rising'],
  ['controversial', 'Controversial'],
]

const SEARCH_SORTS = [
  ['relevance', 'Relevance'],
  ['top', 'Top'],
  ['new', 'New'],
  ['comments', 'Comments'],
]

interface Props {
  onFeedAction: (action: FeedAction) => void
}

export default function PostFeedFilters({
  onFeedAction
}: Props) {
  const {
    searchQuery,
    sortMode,
    setSearchQuery,
    setSortMode
  } = useFeedState()

  const sorts = searchQuery.trim()
    ? SEARCH_SORTS
    : FEED_SORTS

  return (
    <div className={cx('post-feed-filters')}>
      <div className={cx('post-feed-filters-layout')}>

        <div className={cx('post-feed-actions')}>
          <div className={cx('post-feed-action')}>
            <button
              className={cx('btn-link sup-text')}
              onClick={() => onFeedAction({ type: 'submit' })}
            >
              Submit new post
            </button>
          </div>
          <div className={cx('post-feed-action')}>
            <SearchBar
              placeholder="Search"
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
          </div>
        </div>

        <div className={cx('post-feed-filters-inner')}>
          <ul className={cx('post-feed-filter')}>
            {sorts.map(([sort, label]) => (
              <li
                key={sort}
                className={cx(
                  'filter',
                  { active: sortMode === sort })
                }
              >
                <button
                  type="button"
                  className={cx('btn-link')}
                  onClick={() => setSortMode(sort)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={cx('box-shadow')}></div>
    </div>
  )
}
