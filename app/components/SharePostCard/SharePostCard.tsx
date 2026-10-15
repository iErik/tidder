import { useState } from 'react'

import type { Post } from 'api/types'

import { bindStyles } from 'utils/classNames'
import { popupWindow } from 'utils/utils'

import styles from './SharePostCard.module.scss'

const cx = bindStyles(styles)

//  TODO: Move most of these hard coded strings into the api
//  config json file.

function shareOnFacebook(postLink: string): void {
  // Lets just use Reddit's API own variables for now
  let appId = '322647334569188'
  let redirect_uri = 'https://www.reddit.com/share/close'
  let apiUrl = `https://www.facebook.com/dialog/feed?app_id=${appId}`
    + `&link=${encodeURIComponent(`${postLink}?ref=share&ref_source=facebook`)}`
    + `&redirect_uri=${encodeURIComponent(redirect_uri)}&display=popup`

  popupWindow(apiUrl, 550, 450, 'Share')
}

function shareOnTwitter(postLink: string, title: string): void {
  let apiUrl = 'https://twitter.com/intent/tweet'
    + `?url=${encodeURIComponent(`${postLink}?ref=share&ref_source=twitter`)}`
    + `&text=${encodeURIComponent(title + '\n')}&via=reddit`

  popupWindow(apiUrl, 550, 450, 'Share')
}

function shareOnTumblr(postLink: string, title: string): void {
  let apiUrl = 'https://www.tumblr.com/widgets/share/tool/preview'
    + `?canonicalUrl=${encodeURIComponent(`${postLink}?ref=share&ref_source=tumblr`)}`
    + `&title=${encodeURIComponent(title)}&_format=html&posttype=link`

  popupWindow(apiUrl, 550, 450, 'Share')
}

interface Props {
  post: Post
}

export default function SharePostCard({ post }: Props) {
  const [postLink, setPostLink] = useState(`https://www.reddit.com${post.permalink}`)

  return (
    <div className={cx('host')}>
      <div className={cx('social-icons')}>
        <div className={cx('social-icon')}>
          <button className={cx('btn-social facebook')} onClick={() => shareOnFacebook(postLink)}>
            <i className="icn-facebook"></i>
          </button>
        </div>
        <div className={cx('social-icon')}>
          <button className={cx('btn-social twitter')} onClick={() => shareOnTwitter(postLink, post.title)}>
            <i className="icn-twitter"></i>
          </button>
        </div>
        <div className={cx('social-icon')}>
          <button className={cx('btn-social tumblr')} onClick={() => shareOnTumblr(postLink, post.title)}>
            <i className="icn-tumblr"></i>
          </button>
        </div>
      </div>

      <div className={cx('wrapper-input')}>
        <p className={cx('label')}>Link: </p>
        <input type="text" className={cx('input')} value={postLink}
          onChange={(ev) => setPostLink(ev.target.value)} />
      </div>
    </div>
  )
}
