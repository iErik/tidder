import {
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { describe, expect, it } from 'vitest'

import type { Subreddit } from 'api/types'

import { jsonResponse, stubFetch } from '../../test/fetch'

import SubInfoFeedCard from './SubInfoFeedCard'

const subreddit: Subreddit = {
  name: 't5_pics',
  title: 'Pictures',
  url: '/r/pics/',
  display_name: 'pics',
  display_name_prefixed: 'r/pics',
  public_description: '',
  subscribers: 1,
  created_utc: 0,
  icon_img: '',
  subreddit_type: 'public',
  user_is_subscriber: false
}

describe('SubInfoFeedCard', () => {
  it('presses Subscribe once subscribed', async () => {
    const fetch = stubFetch(jsonResponse({ }))
    render(
      <MemoryRouter>
        <SubInfoFeedCard subInfo={subreddit} />
      </MemoryRouter>
    )

    const subscribe = screen.getByRole(
      'button',
      { name: 'Subscribe' }
    )
    expect(subscribe.getAttribute('aria-pressed'))
      .toBe('false')

    fireEvent.click(subscribe)
    expect(subscribe.getAttribute('aria-pressed'))
      .toBe('true')
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
  })
})
