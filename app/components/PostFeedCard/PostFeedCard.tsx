import type { MouseEvent } from 'react'
import { Link } from 'react-router'

import { useThing, voteThing } from 'api/thingState'
import type { Post } from 'api/types'

import ScoreButton from 'components/ScoreButton/ScoreButton'
import type { FeedAction } from 'pages/FeedPage/FeedPage'

import { bindStyles } from 'utils/classNames'
import { timeAgo } from 'utils/timeAgo'
import { abbreviate } from 'utils/utils'

import styles from './PostFeedCard.module.scss'

const cx = bindStyles(styles)

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
  const hasThumbnail = post.thumbnail.startsWith('http')

  const openPost = (ev: MouseEvent) => {
    ev.preventDefault()
    onFeedAction({ type: 'open', thing: rawPost })
  }

  return (
    <div className={cx('host')}>
      <div className={cx('post-score')}>
        <ScoreButton
          score={abbreviate(post.score, 1, 1)}
          likes={post.likes}
          onVote={(dir) => void voteThing(post, dir)} />
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
          style={hasThumbnail ? { backgroundImage: `url(${post.thumbnail})` } : undefined}>

          {!hasThumbnail && (
            <span className={cx('static-thumbnail')}>
              <i className={`icn-${post.thumbnail || 'default'}`}></i>
            </span>
          )}
        </div>

        <span className={cx('post-comments')}>
          <i className="icn-comment"></i>
          {' '}{post.num_comments} comments
        </span>
      </div>
    </div>
  )
}
