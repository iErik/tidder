import type { Post } from 'api/types'

import CommentFeed from 'components/CommentFeed/CommentFeed'
import PostCard from 'components/PostCard/PostCard'
import type { FeedAction } from 'pages/FeedPage/FeedPage'

import { bindStyles } from 'utils/classNames'

import styles from './PostViewer.module.scss'

const cx = bindStyles(styles)

interface Props {
  currentPost: Post
  onFeedAction: (action: FeedAction) => void
}

export default function PostViewer({ currentPost, onFeedAction }: Props) {
  return (
    <div className={cx('host')}>
      <PostCard post={currentPost} onFeedAction={onFeedAction} />
      <CommentFeed post={currentPost} />
    </div>
  )
}
