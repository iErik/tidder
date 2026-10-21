import Icon from 'components/Icon/Icon'

import { bindStyles } from 'utils/classNames'

import styles from './SearchBar.module.scss'

const cx = bindStyles(styles)

interface Props {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  placeholder?: string
}

export default function SearchBar({
  searchQuery,
  onSearchQueryChange,
  placeholder = 'Type your search here...'
}: Props) {
  return (
    <div className={cx('search-bar')}>
      <input
        value={searchQuery}
        onChange={(ev) => onSearchQueryChange(ev.target.value)}
        placeholder={placeholder}
        type="text"
        className={cx(
          'search-bar-input',
          { 'is-active': searchQuery.trim() }
        )}
      />
      <button
        aria-label="Search"
        className={cx('btn-unstyle btn-trigger')}
      >
        <Icon name="search" />
      </button>
    </div>
  )
}
