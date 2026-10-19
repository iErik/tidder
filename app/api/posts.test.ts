import {
  describe,
  expect,
  it
} from 'vitest'

import type {
  CommentThing,
  MoreThing
} from 'api/types'

import {
  jsonResponse,
  stubFetch
} from '../test/fetch'

import {
  submitPost,
  unflattenComments
} from './posts'

const POST = 't3_post'

function comment(id: string, parent: string): CommentThing {
  return {
    kind: 't1',
    data: {
      id,
      name: `t1_${id}`,
      parent_id: parent,
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

function more(id: string, parent: string): MoreThing {
  return {
    kind: 'more',
    data: {
      id,
      name: `t1_${id}`,
      parent_id: parent,
      count: 2,
      children: ['m1', 'm2']
    }
  }
}

// The names of a comment's direct replies
function replies(thing: CommentThing | MoreThing) {
  if (thing.kind !== 't1' || !thing.data.replies) return []
  return thing.data.replies.data.children.map(
    (child) => child.data.name)
}

describe('unflattenComments', () => {
  it('nests replies under parents in the same batch', () => {
    const { roots } = unflattenComments([
      comment('a', POST),
      comment('b', 't1_a'),
      comment('c', 't1_b'),
      comment('d', 't1_a')
    ])

    expect(roots.map((root) => root.data.name)).toEqual(['t1_a'])
    expect(replies(roots[0])).toEqual(['t1_b', 't1_d'])

    const b = roots[0].data.replies
      ? roots[0].data.replies.data.children[0]
      : null
    expect(b && replies(b)).toEqual(['t1_c'])
  })

  it('makes comments whose parent is elsewhere roots', () => {
    const { roots } = unflattenComments([
      comment('a', 't1_loaded-before'),
      comment('b', POST),
      comment('c', 't1_a')
    ])

    expect(roots.map((root) => root.data.name))
      .toEqual(['t1_a', 't1_b'])
    expect(replies(roots[1])).toEqual([])
  })

  it('returns the "more" stub at the top of the batch', () => {
    const stub = more('m', POST)
    const result = unflattenComments([comment('a', POST), stub])

    expect(result.more).toEqual(stub)
    expect(result.roots.map((root) => root.data.name))
      .toEqual(['t1_a'])
  })

  it('nests a "more" stub under its parent', () => {
    const result = unflattenComments([
      comment('a', POST),
      more('m', 't1_a')
    ])

    expect(result.more).toBeNull()
    expect(replies(result.roots[0])).toEqual(['t1_m'])
  })

  it("doesn't change the things it's given", () => {
    const things = [comment('a', POST), comment('b', 't1_a')]
    const before = structuredClone(things)

    unflattenComments(things)

    expect(things).toEqual(before)
  })
})

describe('submitPost', () => {
  const POST_FORM = { sr: 'sub', kind: 'self' as const, title: 'A post' }

  it('resolves to the new post\'s URL', async () => {
    const url = 'https://www.reddit.com/r/sub/comments/abc/'
    stubFetch(jsonResponse({ json: { errors: [], data: { url } } }))

    await expect(submitPost(POST_FORM)).resolves.toEqual({ url })
  })

  it('fails when Reddit sends no URL and no errors', async () => {
    stubFetch(jsonResponse({ json: { errors: [] } }))

    await expect(submitPost(POST_FORM)).rejects.toThrow()
  })
})
