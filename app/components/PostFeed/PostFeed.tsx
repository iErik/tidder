import { useEffect, useRef } from 'react'

import { useFeed } from 'api/queries'
import { useThing } from 'api/thingState'
import type { Post } from 'api/types'

import PostFeedCard from 'components/PostFeedCard/PostFeedCard'
import PostFeedFilters from 'components/PostFeedFilters/PostFeedFilters'
import SubInfoFeedCard from 'components/SubInfoFeedCard/SubInfoFeedCard'
import type { FeedAction } from 'pages/FeedPage/FeedPage'
import { useFeedState } from 'pages/FeedPage/FeedContext'

import { useInfiniteScroll } from 'hooks/useInfiniteScroll'
import {
  useSettledFeedParams
} from 'hooks/useSettledFeedParams'
import { bindStyles } from 'utils/classNames'

import { feedListsPost } from './feedListsPost'
import styles from './PostFeed.module.scss'

const cx = bindStyles(styles)

function uniqueByName<T extends { name: string }>(
  things: T[]
): T[] {
  const seen = new Set<string>()

  return things.filter((thing) =>
    !seen.has(thing.name) && !!seen.add(thing.name))
}

interface EntryProps {
  post: Post
  displaySubreddit: boolean
  feedSource: string
  onFeedAction: (action: FeedAction) => void
}

// A post in the feed, gone once hiding or unhiding it takes
// it out of the feed (see feedListsPost)
function PostEntry({ feedSource, ...card }: EntryProps) {
  const { hidden } = useThing(card.post)

  if (!feedListsPost(feedSource, hidden)) return null

  return (
    <li className={cx('feed-entry')}>
      <PostFeedCard {...card} />
    </li>
  )
}

interface Props {
  onFeedAction: (action: FeedAction) => void
}

export default function PostFeed({ onFeedAction }: Props) {
  const { displaySub, feedSource } = useFeedState()
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
    <div className={cx('post-feed')}>
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
                <PostEntry
                  key={post.name}
                  post={post}
                  displaySubreddit={displaySub}
                  feedSource={feedSource}
                  onFeedAction={onFeedAction}
                />
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
