import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import type { Post } from 'api/types'

import { toast } from 'core/toasts'

import { jsonResponse, stubFetch } from '../../test/fetch'
import { tidder } from '../../test/fakeTidder'

import {
  defaultMenuItems,
  postMenuItems,
  withInspect
} from './menus'

const save = { label: 'Save', action: () => { } }

describe('withInspect', () => {
  it('adds nothing outside dev mode', () => {
    expect(withInspect([save], 10, 20)).toEqual([save])
  })

  it('adds Inspect last in dev mode', () => {
    tidder().isDev = true

    const items = withInspect([save], 10, 20)

    expect(items.map(({ label }) => label))
      .toEqual(['Save', 'Inspect'])
  })

  it('inspects the point that was right-clicked', () => {
    tidder().isDev = true

    withInspect([], 10, 20)[0].action()

    expect(tidder().contextMenu.inspect).toHaveBeenCalledWith(10, 20)
  })
})

describe('defaultMenuItems', () => {
  it('is empty outside dev mode', () => {
    expect(defaultMenuItems(10, 20)).toEqual([])
  })

  it('is only Inspect in dev mode', () => {
    tidder().isDev = true

    expect(defaultMenuItems(10, 20).map(({ label }) => label))
      .toEqual(['Inspect'])
  })
})

function post(patch: Partial<Post> = { }): Post {
  return {
    name: 't3_abc',
    author: 'op',
    permalink: '/r/pics/comments/abc/a_post/',
    saved: false,
    hidden: false,
    ...patch
  } as Post
}

function postMenu(
  thing = post(),
  { user = 'reader', inViewer = false } = { }
) {
  const onFeedAction = vi.fn()
  const items = postMenuItems(thing, {
    user: { name: user },
    onFeedAction,
    inViewer
  })
  const item = (label: string) =>
    items.find((entry) => entry.label === label)!

  return { items, item, onFeedAction }
}

const labels = (items: { label: string }[]) =>
  items.map(({ label }) => label)

describe('postMenuItems', () => {
  it('lists the feed post menu', () => {
    expect(labels(postMenu().items)).toEqual([
      'Open in browser', 'Hide', 'Save', 'Report', 'Share', 'View'
    ])
  })

  it('leaves View out in the viewer', () => {
    expect(labels(postMenu(post(), { inViewer: true }).items))
      .not.toContain('View')
  })

  it('offers Unsave on a saved post', () => {
    const { items } = postMenu(post({ saved: true }))

    expect(labels(items)).toContain('Unsave')
    expect(labels(items)).not.toContain('Save')
  })

  it('enables Report on other people\'s posts', () => {
    expect(postMenu().item('Report').disabled).toBeFalsy()
  })

  it('disables Report on the user\'s own posts', () => {
    expect(postMenu(post(), { user: 'op' }).item('Report').disabled)
      .toBe(true)
  })

  it('disables Report once the post was reported', () => {
    expect(postMenu(post({ reported: true })).item('Report').disabled)
      .toBe(true)
  })

  it('opens the comments page in the browser', () => {
    postMenu().item('Open in browser').action()

    expect(tidder().openExternal).toHaveBeenCalledWith(
      'https://www.reddit.com/r/pics/comments/abc/a_post/'
    )
  })

  it.each([
    ['Report', 'report'],
    ['Share', 'share'],
    ['View', 'open']
  ])('%s opens the %s action', (label, type) => {
    const thing = post()
    const { item, onFeedAction } = postMenu(thing)

    item(label).action()

    expect(onFeedAction).toHaveBeenCalledWith({ type, thing })
  })

  it.each([
    ['Hide', post(), 'Post hidden'],
    ['Save', post(), 'Post saved'],
    ['Unsave', post({ saved: true }), 'Post unsaved']
  ])('%s shows a Toast once Reddit accepts', async (
    label,
    thing,
    message
  ) => {
    stubFetch(jsonResponse({ }))
    const success = vi.spyOn(toast, 'success')

    postMenu(thing).item(label).action()

    await vi.waitFor(() => {
      expect(success).toHaveBeenCalledWith(message)
    })
  })

  it.each([
    ['Hide', post(), 'Couldn\'t hide the post'],
    ['Save', post(), 'Couldn\'t save the post'],
    ['Unsave', post({ saved: true }), 'Couldn\'t unsave the post']
  ])('%s shows an error Toast when Reddit refuses', async (
    label,
    thing,
    message
  ) => {
    stubFetch(jsonResponse({ }, { status: 500 }))
    vi.spyOn(console, 'error').mockImplementation(() => { })
    const error = vi.spyOn(toast, 'error')

    postMenu(thing).item(label).action()

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith(message)
    })
  })
})
