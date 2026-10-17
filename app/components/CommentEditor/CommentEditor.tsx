import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { submitComment } from 'api/posts'
import type { CommentThing } from 'api/types'

import SubmitButton from 'components/SubmitButton/SubmitButton'

import { toast } from 'core/toasts'
import { bindStyles } from 'utils/classNames'

import styles from './CommentEditor.module.scss'

const cx = bindStyles(styles)

interface Props {
  // The fullname of the post or comment being replied to.
  parentId: string
  isChild?: boolean
  onCommentSubmitted: (comment: CommentThing) => void
}

export default function CommentEditor({
  parentId,
  isChild,
  onCommentSubmitted
}: Props) {
  const [text, setText] = useState('')
  const [hasFocus, setFocus] = useState(false)
  const comment = useMutation({
    mutationFn: (body: string) => submitComment(parentId, body),
    onSuccess: (submitted) => {
      onCommentSubmitted(submitted)
      setText('')
    },
    // The text stays in the editor, so it can be sent again.
    onError: () => toast.error('Couldn\'t post the comment')
  })

  const submit = () => {
    if (!text || comment.isPending) return
    comment.mutate(text)
  }

  return (
    <div className={cx('comment-editor')}>
      <div className={cx('comment-editor-layout', { 'is-child': isChild })}>
        <div className={cx('comment-editor-textarea')}>
          <textarea
            className={cx('textarea')}
            name="comment-editor-textarea"
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            spellCheck={hasFocus}
            value={text}
            onChange={(ev) => setText(ev.target.value)}
          >
          </textarea>
        </div>

        <div className={cx('comment-editor-actions')}>
          <div className={cx('comment-editor-action')}>
            <SubmitButton
              onClick={submit}
              isLoading={comment.isPending}
              outline
            >
              Submit
            </SubmitButton>
          </div>
        </div>
      </div>
    </div>
  )
}
