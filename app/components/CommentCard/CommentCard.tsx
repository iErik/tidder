import { useState, type MouseEvent } from 'react'

import { useThing, voteThing } from 'api/thingState'
import type { Comment } from 'api/types'

import SafeHtml from 'components/SafeHtml/SafeHtml'
import ScoreButton from 'components/ScoreButton/ScoreButton'

import { bindStyles } from 'utils/classNames'
import { timeAgo } from 'utils/timeAgo'
import { abbreviate } from 'utils/utils'

import styles from './CommentCard.module.scss'

const cx = bindStyles(styles)

// How many replies are shown at first, by the comment's depth. Deeper
// comments start with their replies hidden.
function initialReplyLimit(depth: number): number {
  if (depth === 0) return 4
  if (depth === 1) return 2
  return -1
}

interface Props {
  comment: Comment
  isParent: boolean
}

export default function CommentCard({ comment: rawComment, isParent }: Props) {
  const comment = useThing(rawComment)
  const [isCollapsed, setCollapsed] = useState(false)
  const [replyLimit, setReplyLimit] = useState(
    () => initialReplyLimit(rawComment.depth))

  const replies = comment.replies ? comment.replies.data.children : []
  const score = abbreviate(comment.score, 1, 1)

  const toggleCollapse = (ev: MouseEvent) => {
    ev.preventDefault()
    setCollapsed(!isCollapsed)
  }

  return (
    <div className={cx('comment-card')}>
      <div
        className={cx('comment-card-layout', {
          'is-parent': isParent,
          'has-child': comment.replies,
          'is-collapsed': isCollapsed
        })}
      >

        <div className={cx('section-comment')}>
          <div className={cx('comment-score')}>
            <ScoreButton
              score={score}
              likes={comment.likes}
              onVote={(dir) => voteThing(comment, dir)}
            />
          </div>

          <div className={cx('comment-contents')}>
            <div className={cx('comment-meta')}>
              <p className={cx('meta')}>
                <a
                  href=""
                  className={cx('meta-collapse')}
                  onClick={toggleCollapse}
                >
                  {isCollapsed ? '[+]' : '[–]'}
                </a>{' '}
                <span className={cx('meta-author bold-text')}>
                  {comment.author}
                </span>{' '}
                {isCollapsed && <>
                  <span className={cx('meta-score bold-text')}>
                    {score} points
                  </span>{' '}
                </>}
                <span className={cx('meta-time')}>
                  {timeAgo(comment.created_utc * 1000)}
                </span>
              </p>
            </div>

            <SafeHtml className={cx('comment-body')} html={comment.body_html} />
          </div>
        </div>

        {comment.replies && (
          <div className={cx('section-replies')}>
            {replies.map((reply, i) =>
              reply.kind === 't1' && i < replyLimit && (
                <div className={cx('wrapper-reply')} key={reply.data.name}>
                  <CommentCard comment={reply.data} isParent={false} />
                </div>
              ))}

            {replyLimit < replies.length && (
              <div
                className={cx('reply-pagination')}
                onClick={() => setReplyLimit(replyLimit + 3)}
              >
                <span className={cx('label')}>Load more replies</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
