import { render } from '@testing-library/react'

import { describe, expect, it, vi } from 'vitest'

import { FeedProvider } from 'pages/FeedPage/FeedContext'

import PostFeedFilters from './PostFeedFilters'
import styles from './PostFeedFilters.module.scss'

function shadow(scrolled: boolean) {
  const view = render(
    <FeedProvider>
      <PostFeedFilters scrolled={scrolled} onFeedAction={vi.fn()} />
    </FeedProvider>
  )

  return view.container.querySelector('.box-shadow')!
}

describe('PostFeedFilters', () => {
  it('hides the shadow at the top of the feed', () => {
    expect(shadow(false).className).not.toMatch(/-shown/)
  })

  it('shows the shadow once the feed is scrolled', () => {
    expect(shadow(true).classList).toContain(styles['-shown'])
  })
})
