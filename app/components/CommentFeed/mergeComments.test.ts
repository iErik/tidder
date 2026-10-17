import {
  describe,
  expect,
  it
} from 'vitest'

import type { CommentThing } from 'api/types'

import { mergeComments } from './mergeComments'

function comment(id: string): CommentThing {
  return {
    kind: 't1',
    data: {
      id,
      name: `t1_${id}`,
      parent_id: 't3_post',
      author: 'author',
      score: 1,
      depth: 0,
      created_utc: 0,
      likes: null,
      saved: false,
      body_html: '',
      subreddit: 'sub',
      subreddit_name_prefixed: 'r/sub',
      replies: ''
    }
  }
}

function names(comments: CommentThing[]) {
  return comments.map((c) => c.data.name)
}

describe('mergeComments', () => {
  it('puts submitted comments first, then the thread, then loaded', () => {
    const merged = mergeComments(
      [comment('new2'), comment('new1')],
      [comment('a'), comment('b')],
      [comment('c')]
    )

    expect(names(merged)).toEqual(
      ['t1_new2', 't1_new1', 't1_a', 't1_b', 't1_c'])
  })

  it('drops a submitted comment once the thread has it', () => {
    const merged = mergeComments(
      [comment('new')],
      [comment('a'), comment('new')],
      []
    )

    expect(names(merged)).toEqual(['t1_a', 't1_new'])
  })

  it('drops a submitted comment once a loaded page has it', () => {
    const merged = mergeComments(
      [comment('new')],
      [comment('a')],
      [comment('new')]
    )

    expect(names(merged)).toEqual(['t1_a', 't1_new'])
  })

  it('keeps submitted comments when another sort comes back', () => {
    const submitted = [comment('new')]

    // After a sort change the thread is refetched in the new order and
    // the loaded comments are reset, but the submitted ones stay.
    const best = mergeComments(submitted, [comment('a'), comment('b')], [])
    const old = mergeComments(submitted, [comment('b'), comment('a')], [])

    expect(names(best)).toEqual(['t1_new', 't1_a', 't1_b'])
    expect(names(old)).toEqual(['t1_new', 't1_b', 't1_a'])
  })

  it("doesn't change the lists it's given", () => {
    const submitted = [comment('new'), comment('a')]
    const thread = [comment('a')]
    const loaded = [comment('b')]
    const copies = structuredClone({ submitted, thread, loaded })

    mergeComments(submitted, thread, loaded)

    expect({ submitted, thread, loaded }).toEqual(copies)
  })
})
