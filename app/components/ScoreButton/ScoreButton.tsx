import { bindStyles } from 'utils/classNames'

import styles from './ScoreButton.module.scss'

const cx = bindStyles(styles)

interface Props {
  score: string
  likes: boolean | null

  // Called with the vote direction: 1, -1, or 0 to take the vote back.
  onVote(dir: -1 | 0 | 1): void
}

export default function ScoreButton({ score, likes, onVote }: Props) {
  return (
    <div className={cx('host')}>
      <button
        onClick={() => onVote(likes ? 0 : 1)}
        className={cx('btn-vote upvote', { 'is-active': likes === true })}>
        <i className="icn-arrow-up"></i>
      </button>

      <div className={cx('wrapper-score')}>
        <span className={cx('score')}>{score}</span>
      </div>

      <button
        onClick={() => onVote(likes === false ? 0 : -1)}
        className={cx('btn-vote downvote', { 'is-active': likes === false })}>
        <i className="icn-arrow-down"></i>
      </button>
    </div>
  )
}
