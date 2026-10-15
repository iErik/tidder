import { useState } from 'react'

import { submitComment } from 'api/posts'
import type { CommentThing } from 'api/types'

import SubmitButton from 'components/SubmitButton/SubmitButton'

import { bindStyles } from 'utils/classNames'

import styles from './CommentEditor.module.scss'

const cx = bindStyles(styles)

interface Props {
  // The fullname of the post or comment being replied to.
  parentId: string
  isChild?: boolean
  onCommentSubmitted(comment: CommentThing): void
}

export default function CommentEditor({ parentId, isChild, onCommentSubmitted }: Props) {
  const [text, setText] = useState('')
  const [hasFocus, setFocus] = useState(false)
  const [isLoading, setLoading] = useState(false)

  const submit = async () => {
    if (!text || isLoading) return

    setLoading(true)

    try {
      onCommentSubmitted(await submitComment(parentId, text))
      setText('')
    } catch (err) {
      console.error('Submitting the comment failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cx('host')}>
      <div className={cx('comment-editor-layout', { 'is-child': isChild })}>
        <div className={cx('comment-editor-textarea')}>
          <textarea className={cx('textarea')} name="comment-editor-textarea"
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            spellCheck={hasFocus}
            value={text}
            onChange={(ev) => setText(ev.target.value)}>
          </textarea>
        </div>

        <div className={cx('comment-editor-actions')}>
          <div className={cx('comment-editor-action')}>
            <SubmitButton onClick={submit} isLoading={isLoading} outline>
              Submit
            </SubmitButton>
          </div>
        </div>
      </div>
    </div>
  )
}
