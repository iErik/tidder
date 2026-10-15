import { useEffect, useMemo, useRef, useState } from 'react'

import { useFeed, type FeedParams } from 'api/queries'

import PostFeedCard from 'components/PostFeedCard/PostFeedCard'
import PostFeedFilters from 'components/PostFeedFilters/PostFeedFilters'
import SubInfoFeedCard from 'components/SubInfoFeedCard/SubInfoFeedCard'
import type { FeedAction } from 'pages/FeedPage/FeedPage'
import { useFeedState } from 'pages/FeedPage/FeedContext'

import { useInfiniteScroll } from 'hooks/useInfiniteScroll'
import { bindStyles } from 'utils/classNames'

import styles from './PostFeed.module.scss'

const cx = bindStyles(styles)

// How long typing in the search bar (or changing the sort)
// has to pause before the feed reloads.
const FILTER_DELAY = 300

// The feed params, with changes to the search and sort
// applied once they settle. A new source (navigating to
// another feed) applies at once.
function useSettledFeedParams(): FeedParams {
  const {
    feedSource,
    sortMode,
    searchQuery
  } = useFeedState()

  const live = useMemo(
    () => ({
      source: feedSource,
      sort: sortMode,
      query: searchQuery
    }),
    [feedSource, sortMode, searchQuery])

  const [settled, setSettled] = useState(live)

  useEffect(() => {
    if (live.source !== settled.source) {
      // A new source skips the debounce. Settling it during
      // render instead would mean restructuring this hook.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettled(live)
      return
    }

    const timer = setTimeout(
      () => setSettled(live),
      FILTER_DELAY)

    return () => clearTimeout(timer)
  }, [live, settled.source])

  return settled
}

function uniqueByName<T extends { name: string }>(
  things: T[]
): T[] {
  const seen = new Set<string>()

  return things.filter((thing) =>
    !seen.has(thing.name) && !!seen.add(thing.name))
}

interface Props {
  onFeedAction: (action: FeedAction) => void
}

export default function PostFeed({ onFeedAction }: Props) {
  const { displaySub } = useFeedState()
  const feed = useFeed(useSettledFeedParams())

  const listRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useInfiniteScroll(
    listRef,
    endRef,
    () => void feed.fetchNextPage(),
    {
      disabled: !feed.hasNextPage || feed.isFetchingNextPage
    })

  useEffect(() => {
    if (feed.error)
      console.error('Loading the feed failed:', feed.error)
  }, [feed.error])

  // A listing can shift while it's paged through, repeating
  // an entry on the next page.
  const posts = uniqueByName(feed.data?.pages
    .flatMap((page) => page.posts) ?? [])
  const subs = uniqueByName(feed.data?.pages
    .flatMap((page) => page.subs) ?? [])

  return (
    <div className={cx('host')}>
      <PostFeedFilters onFeedAction={onFeedAction} />

      {feed.isPending ? (
        <div className={cx('wrapper-feed-spinner')}>
          <div className={cx('feed-spinner')}>
            <div className={cx('dot-spinner')}>
              <span className={cx('bounce')}></span>
              <span className={cx('bounce')}></span>
              <span className={cx('bounce')}></span>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cx('feed-list')}
          style={{ height: '100%' }}
          ref={listRef}
        >
          {posts.length > 0 && (
            <ul className={cx('feed-entries')}>
              {posts.map((post) => (
                <li
                  className={cx('feed-entry')}
                  key={post.name}
                >
                  <PostFeedCard
                    post={post}
                    displaySubreddit={displaySub}
                    onFeedAction={onFeedAction}
                  />
                </li>
              ))}
            </ul>
          )}

          {subs.length > 0 && (
            <ul className={cx('feed-entries')}>
              {subs
                .filter((sub) => sub.subreddit_type !== 'private')
                .map((sub) => (
                  <li
                    className={cx('feed-entry')}
                    key={sub.name}
                  >
                    <SubInfoFeedCard subInfo={sub} />
                  </li>
                ))}
            </ul>
          )}

          <div ref={endRef}></div>
        </div>
      )}
    </div>
  )
}
