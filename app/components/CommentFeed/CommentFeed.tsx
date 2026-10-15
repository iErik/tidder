import { useState } from 'react'

import { getMoreComments } from 'api/posts'
import { useComments } from 'api/queries'
import type {
  CommentThing,
  MoreThing,
  Post
} from 'api/types'

import CommentCard from 'components/CommentCard/CommentCard'
import CommentEditor from 'components/CommentEditor/CommentEditor'
import Icon from 'components/Icon/Icon'

import { bindStyles } from 'utils/classNames'

import styles from './CommentFeed.module.scss'

const cx = bindStyles(styles)

const SORT_MODES = [
  ['confidence', 'best'],
  ['top', 'top'],
  ['controversial', 'controversial'],
  ['old', 'old'],
  ['random', 'random'],
  ['qa', 'Q&A'],
]

// Top-level comments are shown ten at a time.
const PAGE_SIZE = 10

// What the user added to the thread Reddit sent: their own new comments,
// and comments loaded from behind "load more". Reset when the sort changes.
interface Additions {
  submitted: CommentThing[]
  loaded: CommentThing[]

  // Replaces the thread's own "more" entry once more has been loaded.
  more?: MoreThing | null
}

const NO_ADDITIONS: Additions = { submitted: [], loaded: [] }

interface Props {
  post: Post
}

export default function CommentFeed({ post }: Props) {
  const [sortMode, setSortMode] = useState('confidence')
  const [additions, setAdditions] = useState(NO_ADDITIONS)
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)

  const thread = useComments(post, sortMode)

  const comments = [
    ...additions.submitted,
    ...(thread.data?.comments ?? []),
    ...additions.loaded
  ]
  const more = additions.more !== undefined
    ? additions.more
    : thread.data?.more ?? null
  const hiddenCount =
    Math.max(comments.length - displayLimit, 0)
    + (more?.data.count ?? 0)

  const changeSortMode = (sort: string) => {
    setSortMode(sort)
    setAdditions(NO_ADDITIONS)
    setDisplayLimit(PAGE_SIZE)
  }

  const loadMore = async () => {
    if (displayLimit < comments.length) {
      setDisplayLimit(displayLimit + PAGE_SIZE)
      return
    }

    if (!more || loadingMore) return
    setLoadingMore(true)

    try {
      const page = await getMoreComments(post.name, more, sortMode)

      setAdditions((prev) => ({
        ...prev,
        loaded: [...prev.loaded, ...page.comments],
        more: page.more
      }))
      setDisplayLimit((limit) => limit + page.comments.length)
    } catch (err) {
      console.error('Loading more comments failed:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const addComment = (comment: CommentThing) => {
    setAdditions((prev) => ({
      ...prev,
      submitted: [comment, ...prev.submitted]
    }))
    setDisplayLimit((limit) => limit + 1)
  }

  return (
    <div className={cx('host')}>
      <div className={cx('wrapper-comment-editor')}>
        <CommentEditor parentId={post.name} onCommentSubmitted={addComment} />
      </div>

      <div className={cx('comments-controls')}>
        <div className={cx('comments-meta')}>
          <Icon name="comment" />
          <span className={cx('meta')}>
            {post.num_comments + additions.submitted.length} comments
          </span>
        </div>

        <div className={cx('comments-modes')}>
          {SORT_MODES.map(([sort, label]) => (
            <div
              key={sort}
              className={cx('comments-mode',
                { active: sortMode === sort })}
            >
              <button
                className={cx('link-btn')}
                onClick={() => changeSortMode(sort)}
              >
                {label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {thread.isPending && (
        <div className={cx('wrapper-feed-spinner')}>
          <div className={cx('feed-spinner')}>
            <div className={cx('dot-spinner')}>
              <span className={cx('bounce')}></span>
              <span className={cx('bounce')}></span>
              <span className={cx('bounce')}></span>
            </div>
          </div>
        </div>
      )}

      {!thread.isPending && comments.length > 0 && (
        <div className={cx('comments-feed')}>
          <ul className={cx('comments-feed-entries')}>
            {comments.slice(0, displayLimit).map((comment) => (
              <li className={cx('comments-feed-entry')} key={comment.data.name}>
                <CommentCard comment={comment.data} isParent={true} />
              </li>
            ))}
          </ul>

          {hiddenCount > 0 && (
            <div className={cx('comments-morechildren')}>
              <button
                type="button"
                className={cx('btn-load button outline')}
                disabled={loadingMore}
                onClick={loadMore}
              >
                Load {hiddenCount} more comments
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
