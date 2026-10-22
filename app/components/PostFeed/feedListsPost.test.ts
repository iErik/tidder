import { describe, expect, it } from 'vitest'

import { feedListsPost } from './feedListsPost'

describe('feedListsPost', () => {
  it.each(['home', 'r/pics', '/user/u/m/multi/'])(
    '%s leaves hidden posts out',
    (source) => {
      expect(feedListsPost(source, false)).toBe(true)
      expect(feedListsPost(source, true)).toBe(false)
    }
  )

  it('keeps hidden posts in the Saved feed', () => {
    expect(feedListsPost('saved', false)).toBe(true)
    expect(feedListsPost('saved', true)).toBe(true)
  })

  it('lists only hidden posts in the Hidden feed', () => {
    expect(feedListsPost('hidden', true)).toBe(true)
    expect(feedListsPost('hidden', false)).toBe(false)
  })
})
