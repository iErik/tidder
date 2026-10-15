import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router'

import { saveThing, useThing, voteThing } from 'api/thingState'
import type { Post } from 'api/types'

import SafeHtml from 'components/SafeHtml/SafeHtml'
import ScoreButton from 'components/ScoreButton/ScoreButton'
import type { FeedAction } from 'pages/FeedPage/FeedPage'

import { bindStyles } from 'utils/classNames'
import { timeAgo } from 'utils/timeAgo'
import { abbreviate } from 'utils/utils'

import styles from './PostCard.module.scss'

const cx = bindStyles(styles)

function previewImage(post: Post) {
  return post.preview?.images[0]
}

function hasContent(post: Post): boolean {
  const variants = previewImage(post)?.variants

  return (post.is_self && !!post.selftext_html)
    || post.media !== null
    || (!!variants && Object.keys(variants).length > 0)
    || (!!post.post_hint && post.post_hint !== 'link')
}

function isImage(post: Post): boolean {
  if (post.media || post.is_self) return false

  const image = previewImage(post)
  return !!image && !image.variants['mp4']
}

function isVideo(post: Post): boolean {
  if ((post.media && !post.media['reddit_video']) || post.is_self) return false

  return post.is_video || !!previewImage(post)?.variants['mp4']
}

function isEmbedded(post: Post): boolean {
  return post.media !== null && post.is_video === false
}

// NOTE: This does not work with subreddits that disable previews
function imageSource(post: Post): string {
  const image = previewImage(post)!
  return image.variants.gif ? image.variants.gif.source.url : image.source.url
}

function videoSource(post: Post): string | undefined {
  if (post.is_video)
    return post.media!.reddit_video!.fallback_url

  return previewImage(post)?.variants['mp4']?.source.url
}

function openExternal(ev: MouseEvent, url: string): void {
  ev.preventDefault()
  ev.stopPropagation()
  window.tidder.openExternal(url)
}

interface Props {
  post: Post
  onFeedAction: (action: FeedAction) => void
}

export default function PostCard({ post: rawPost, onFeedAction }: Props) {
  const post = useThing(rawPost)
  const [isCollapsed, setCollapsed] = useState(false)
  const showContent = hasContent(post)

  return (
    <div className={cx('host')}>
      <div className={cx('post-card-layout')}>
        <div className={cx('post-card')}>

          <div className={cx('post-info')}>
            <div className={cx('post-score')}>
              <ScoreButton
                score={abbreviate(post.score, 1, 1)}
                likes={post.likes}
                onVote={(dir) => void voteThing(post, dir)} />
            </div>

            <div className={cx('post-header')}>
              <div className={cx('post-sub')}>
                <Link to={`/r/${post.subreddit}`} className={cx('meta-sub')}>
                  {post.subreddit}
                </Link>
              </div>

              <div className={cx('post-link')}>
                <a href="#" className={cx('link')} onClick={(ev) => openExternal(ev, post.url)}>
                  {post.title}
                </a>
              </div>

              <div className={cx('post-meta')}>
                <p className={cx('meta')}>
                  Submitted {timeAgo(post.created_utc * 1000)} by{' '}
                  <span className={cx('meta-author')}>{post.author}</span>
                </p>
              </div>

              <div className={cx('post-actions')}>
                <div className={cx('post-action')}>
                  <span className={cx('btn-action')}>
                    <a href="#"
                      onClick={(ev) => openExternal(ev, `https://www.reddit.com${post.permalink}`)}>
                      {post.num_comments} comments
                    </a>
                  </span>
                </div>
                <div className={cx('post-action')}>
                  <button type="button" className={cx('btn-action')}
                    onClick={() => void saveThing(post, !post.saved)}>
                    {post.saved ? 'Unsave' : 'Save'}
                  </button>
                </div>
                <div className={cx('post-action')}>
                  <button type="button" className={cx('btn-action')}
                    onClick={() => onFeedAction({ type: 'report', thing: post })}
                    disabled={post.reported}>
                    {post.reported ? 'Reported' : 'Report'}
                  </button>
                </div>
                <div className={cx('post-action')}>
                  <button type="button" className={cx('btn-action')}
                    onClick={() => onFeedAction({ type: 'share', thing: post })}>
                    Share
                  </button>
                </div>
                <div className={cx('post-action')}>
                  {showContent && (
                    <button type="button" className={cx('btn-action')}
                      onClick={() => setCollapsed(!isCollapsed)}>
                      {isCollapsed ? 'Uncollapse' : 'Collapse'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showContent && (
            <div className={cx('post-content', { 'is-collapsed': isCollapsed })}>

              {post.is_self &&
                <SafeHtml className={cx('post-text typography')} html={post.selftext_html} />}

              {isEmbedded(post) &&
                <SafeHtml className={cx('post-media')} html={post.secure_media_embed.content} embed />}

              {isImage(post) && (
                <div className={cx('post-image')}>
                  <img className={cx('image')} src={imageSource(post)} />
                </div>
              )}

              {isVideo(post) && (
                <div className={cx('post-video')}>
                  <video className={cx('video')}
                    autoPlay={!post.is_video}
                    controls={post.is_video}
                    loop={!post.is_video}
                    muted={!post.is_video}
                    src={videoSource(post)}>
                  </video>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
