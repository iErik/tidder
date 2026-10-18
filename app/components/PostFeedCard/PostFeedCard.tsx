import type { MouseEvent } from 'react'
import { Link } from 'react-router'

import { useThing, voteThing } from 'api/thingState'
import type { Post } from 'api/types'

import {
  openMenu,
  postMenuItems
} from 'components/ContextMenu/menus'
import Icon, { type IconName } from 'components/Icon/Icon'
import ScoreButton from 'components/ScoreButton/ScoreButton'
import type { FeedAction } from 'pages/FeedPage/FeedPage'

import { useAuth } from 'core/auth'
import { bindStyles } from 'utils/classNames'
import { timeAgo } from 'utils/timeAgo'
import { abbreviate } from 'utils/utils'

import styles from './PostFeedCard.module.scss'

const cx = bindStyles(styles)

// The icon shown for a post without a thumbnail image, whose
// `thumbnail` is then a post type ('self', 'nsfw', 'spoiler',
// 'default', 'image'…) or empty.
function postTypeIcon(thumbnail: string): IconName {
  switch (thumbnail) {
    case 'self':
    case 'nsfw':
    case 'spoiler':
      return thumbnail
    default:
      return 'default'
  }
}

interface Props {
  post: Post
  displaySubreddit?: boolean
  onFeedAction: (action: FeedAction) => void
}

export default function PostFeedCard({
  post: rawPost,
  displaySubreddit = true,
  onFeedAction
}: Props) {
  const post = useThing(rawPost)
  const { user } = useAuth()
  const hasThumbnail = post.thumbnail.startsWith('http')

  const openPost = (ev: MouseEvent) => {
    ev.preventDefault()
    onFeedAction({ type: 'open', thing: rawPost })
  }

  return (
    <div
      className={cx('post-feed-card')}
      onContextMenu={(ev) => openMenu(
        ev,
        postMenuItems(post, { user, onFeedAction })
      )}
    >
      <div className={cx('post-score')}>
        <ScoreButton
          score={abbreviate(post.score, 1, 1)}
          likes={post.likes}
          onVote={(dir) => voteThing(post, dir)}
        />
      </div>

      <div className={cx('post-contents')}>
        {displaySubreddit && (
          <div className={cx('post-sub')}>
            <Link className={cx('meta-sub')} to={`/r/${post.subreddit}`}>
              {post.subreddit}
            </Link>
          </div>
        )}

        <div className={cx('post-link')}>
          <a className={cx('link')} onClick={openPost}>
            {post.title}
          </a>
        </div>

        <div className={cx('post-meta')}>
          <p className={cx('meta')}>
            Submitted {timeAgo(post.created_utc * 1000)} by{' '}
            <span className={cx('meta-author')}>{post.author}</span>
          </p>
        </div>
      </div>

      <div className={cx('wrapper-thumbnail')}>
        <div
          className={cx('post-thumbnail', { 'static-bg': !hasThumbnail })}
          style={hasThumbnail
            ? { backgroundImage: `url(${post.thumbnail})` }
            : undefined}
        >

          {!hasThumbnail && (
            <span className={cx('static-thumbnail')}>
              <Icon name={postTypeIcon(post.thumbnail)} />
            </span>
          )}
        </div>

        <span className={cx('post-comments')}>
          <Icon name="comment" />
          {' '}{post.num_comments} comments
        </span>
      </div>
    </div>
  )
}
