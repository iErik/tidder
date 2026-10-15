import { useState, type FormEvent } from 'react'

import { RedditJsonError } from 'api/client'
import { submitPost, type NewPost } from 'api/posts'
import { useSubNameSuggestions } from 'api/queries'

import SubmitButton from 'components/SubmitButton/SubmitButton'

import { useDebouncedValue } from 'hooks/useDebouncedValue'
import { bindStyles } from 'utils/classNames'

import styles from './PostSubmit.module.scss'

const cx = bindStyles(styles)

interface Props {
  onCancel: () => void
}

export default function PostSubmit({ onCancel }: Props) {
  const [post, setPost] = useState<NewPost>({ kind: 'link', title: '', sr: '', url: '', text: '' })
  const [isDirty, setDirty] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [postUrl, setPostUrl] = useState<string | null>(null)

  const subQuery = useDebouncedValue(post.sr.trim(), 250)
  const suggestions = useSubNameSuggestions(subQuery).data ?? []

  const isValid = !!post.title && !!post.sr.trim()

  const update = (patch: Partial<NewPost>) => {
    setPost({ ...post, ...patch })
    setDirty(true)
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!isValid || isLoading) return

    setLoading(true)
    setErrors([])

    try {
      const { url } = await submitPost({ ...post, sr: post.sr.trim() })
      setPostUrl(url)
    } catch (err) {
      setErrors(err instanceof RedditJsonError
        ? err.errors.map(([, reason]) => reason)
        : ['The post could not be submitted. Please try again.'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cx('host')}>
      <div className={cx('tab-group')}>
        <div className={cx('tab', { 'is-active': post.kind === 'link' })}
          onClick={() => setPost({ ...post, kind: 'link' })}>
          <div className={cx('wrapper-label')}>
            <span className={cx('tab-label')}>Link</span>
          </div>
        </div>

        <div className={cx('tab', { 'is-active': post.kind === 'self' })}
          onClick={() => setPost({ ...post, kind: 'self' })}>
          <div className={cx('wrapper-label')}>
            <span className={cx('tab-label')}>Text</span>
          </div>
        </div>
      </div>

      <form className={cx('form-group')} onSubmit={(ev) => void submit(ev)} hidden={!!postUrl}>

        <div className={cx('form-input')}>
          <label htmlFor="post-title" className={cx('label')}>Title</label>
          <input id="post-title" name="postTitle" type="text" className={cx('input')}
            required
            placeholder="Title..."
            value={post.title}
            onChange={(ev) => update({ title: ev.target.value })} />
        </div>

        <div className={cx('form-input')}>
          <label htmlFor="post-sub" className={cx('label')}>Subreddit</label>
          <input id="post-sub" name="postSub" type="text" className={cx('input')}
            required
            autoComplete="off"
            list="post-sub-suggestions"
            placeholder="Subreddit..."
            value={post.sr}
            onChange={(ev) => update({ sr: ev.target.value })} />

          <datalist id="post-sub-suggestions">
            {suggestions.map((name) =>
              <option key={name} value={name}></option>)}
          </datalist>
        </div>

        {post.kind === 'link' && (
          <div className={cx('form-input')}>
            <label htmlFor="post-url" className={cx('label')}>URL</label>
            <input id="post-url" name="postUrl" type="text" className={cx('input')}
              placeholder="URL..."
              value={post.url}
              onChange={(ev) => update({ url: ev.target.value })} />
          </div>
        )}

        {post.kind === 'self' && (
          <div className={cx('form-input')}>
            <label htmlFor="post-text" className={cx('label')}>Text</label>
            <textarea id="post-text" name="postText" className={cx('textarea')}
              value={post.text}
              onChange={(ev) => update({ text: ev.target.value })}>
            </textarea>
          </div>
        )}

        {errors.length > 0 && (
          <div className={cx('form-errors')}>
            {errors.map((error, i) => <span key={i} className={cx('error')}>{error}</span>)}
          </div>
        )}

        <div className={cx('form-controls')}>
          <div className={cx('form-control')}>
            <SubmitButton
              isDisabled={!isDirty || !isValid}
              isLoading={isLoading}>
              Submit
            </SubmitButton>
          </div>
          <div className={cx('form-control')}>
            <button type="button" className={cx('button secondary')} onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </form>

      {postUrl && (
        <div className={cx('form-success')}>
          <p>Your post was successfully submitted!</p>
          <div className={cx('controls')}>
            <a href="#" className={cx('button')}
              onClick={(ev) => {
                ev.preventDefault()
                window.tidder.openExternal(postUrl)
              }}>
              Go to post
            </a>
            <button type="button" className={cx('button secondary')} onClick={onCancel}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
