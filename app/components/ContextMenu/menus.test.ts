import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import type { Post } from 'api/types'

import type { ContextMenuItem } from 'core/contextMenu'

import { toast } from 'core/toasts'

import { jsonResponse, stubFetch } from '../../test/fetch'
import {
  contextMenuParams,
  tidder
} from '../../test/fakeTidder'

import {
  defaultMenuItems,
  embedMenuItems,
  fieldMenuItems,
  linkMenuItems,
  mediaMenuItems,
  postMenuItems,
  selectionMenuItems,
  targetMenuItems,
  withInspect
} from './menus'
import type { EditFlags, LinkTarget } from './target'

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

describe('selection menu', () => {
  it('lists only Copy text', () => {
    expect(labels(selectionMenuItems('Some text')))
      .toEqual(['Copy text'])
  })

  it('adds Inspect last in dev mode', () => {
    tidder().isDev = true
    const target = { type: 'selection', text: 'Some text' } as const

    expect(labels(targetMenuItems(target, 10, 20)))
      .toEqual(['Copy text', 'Inspect'])
  })

  it('copies the selection', () => {
    const success = vi.spyOn(toast, 'success')

    selectionMenuItems('Some text')[0].action()

    expect(tidder().contextMenu.writeText)
      .toHaveBeenCalledWith('Some text')
    expect(success).toHaveBeenCalledWith('Text copied')
  })
})

describe('link menu', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const url = 'https://www.reddit.com/r/pics'

  // The link r/pics, right-clicked on `selection` if given
  function link(selection?: string): LinkTarget {
    return { type: 'link', url, linkText: 'r/pics', selection }
  }

  function item(label: string, selection?: string) {
    return linkMenuItems(link(selection))
      .find((entry) => entry.label === label)!
  }

  it('lists the link menu', () => {
    expect(labels(linkMenuItems(link()))).toEqual([
      'Open in browser', 'Copy link', 'Copy link\'s text'
    ])
  })

  it('adds Copy selection on a selection', () => {
    expect(labels(linkMenuItems(link('Some text')))).toEqual([
      'Open in browser',
      'Copy link',
      'Copy link\'s text',
      'Copy selection'
    ])
  })

  it('adds Inspect last in dev mode', () => {
    tidder().isDev = true

    expect(labels(targetMenuItems(link('Some text'), 10, 20))).toEqual([
      'Open in browser',
      'Copy link',
      'Copy link\'s text',
      'Copy selection',
      'Inspect'
    ])
  })

  it('opens the link in the browser, with no toast', () => {
    const success = vi.spyOn(toast, 'success')

    item('Open in browser').action()

    expect(tidder().openExternal).toHaveBeenCalledWith(url)
    expect(success).not.toHaveBeenCalled()
  })

  it('copies the link', () => {
    const success = vi.spyOn(toast, 'success')

    item('Copy link').action()

    expect(tidder().contextMenu.writeText).toHaveBeenCalledWith(url)
    expect(success).toHaveBeenCalledWith('Link copied')
  })

  it('copies the link\'s text', () => {
    const success = vi.spyOn(toast, 'success')

    item('Copy link\'s text').action()

    expect(tidder().contextMenu.writeText)
      .toHaveBeenCalledWith('r/pics')
    expect(success).toHaveBeenCalledWith('Text copied')
  })

  it('copies the selection', () => {
    const success = vi.spyOn(toast, 'success')

    item('Copy selection', 'Some text').action()

    expect(tidder().contextMenu.writeText)
      .toHaveBeenCalledWith('Some text')
    expect(success).toHaveBeenCalledWith('Text copied')
  })
})

// A field's edit flags: none allowed, unless overridden
function editFlags(
  flags: Partial<EditFlags> = { }
): EditFlags {
  return { ...contextMenuParams().editFlags, ...flags }
}

const allowed = editFlags({
  canCopy: true,
  canPaste: true,
  canCut: true,
  canSelectAll: true
})

// The labels of the disabled items
function disabled(items: ContextMenuItem[]) {
  return labels(items.filter((item) => item.disabled))
}

describe('text field menu', () => {
  it('lists Copy, Paste, Cut and Select all', () => {
    expect(labels(fieldMenuItems(allowed)))
      .toEqual(['Copy', 'Paste', 'Cut', 'Select all'])
    expect(disabled(fieldMenuItems(allowed))).toEqual([])
  })

  it('adds Inspect last in dev mode', () => {
    tidder().isDev = true
    const target = { type: 'field', editFlags: allowed } as const

    expect(labels(targetMenuItems(target, 10, 20)))
      .toEqual(['Copy', 'Paste', 'Cut', 'Select all', 'Inspect'])
  })

  // Electron reports these from the field and the clipboard
  it.each([
    ['nothing is selected', { canCopy: false, canCut: false },
      ['Copy', 'Cut']],
    ['the field is read-only', { canCut: false, canPaste: false },
      ['Paste', 'Cut']],
    ['the clipboard has no text', { canPaste: false }, ['Paste']],
    ['the field is empty', { canSelectAll: false }, ['Select all']]
  ])('disables what doesn\'t apply when %s', (_, flags, expected) => {
    const items = fieldMenuItems({ ...allowed, ...flags })

    expect(disabled(items)).toEqual(expected)
  })

  it('runs each command on the focused field, quietly', () => {
    const success = vi.spyOn(toast, 'success')

    fieldMenuItems(allowed).forEach((item) => item.action())

    expect(tidder().contextMenu.edit.mock.calls)
      .toEqual([['copy'], ['paste'], ['cut'], ['selectAll']])
    expect(success).not.toHaveBeenCalled()
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

const IMAGE = { url: 'https://i.redd.it/abc.jpg', title: 'A cat' }
const VIDEO = { url: 'https://v.redd.it/abc/DASH_720.mp4', title: 'A clip' }

const find = (items: ContextMenuItem[], label: string) =>
  items.find((entry) => entry.label === label)!

describe('media menus', () => {
  it('lists the media menu with a point to copy at', () => {
    const items = mediaMenuItems(IMAGE, { x: 10, y: 20 })

    expect(labels(items)).toEqual(['Download', 'Copy', 'Copy URL'])
    expect(items.some(({ disabled }) => disabled)).toBe(false)
  })

  it('disables Copy without a point', () => {
    const items = mediaMenuItems(VIDEO)

    expect(labels(items)).toEqual(['Download', 'Copy', 'Copy URL'])
    expect(find(items, 'Copy').disabled).toBe(true)
  })

  it('downloads under the title-based name', async () => {
    const { download } = tidder().contextMenu
    download.mockResolvedValue({ status: 'saved', fileName: 'A cat.jpg' })
    const success = vi.spyOn(toast, 'success')

    find(mediaMenuItems(IMAGE, { x: 10, y: 20 }), 'Download').action()

    expect(download).toHaveBeenCalledWith(IMAGE.url, 'A cat.jpg')
    await vi.waitFor(() => {
      expect(success).toHaveBeenCalledWith('Downloaded A cat.jpg')
    })
  })

  it.each([
    ['a failed download', () => Promise.resolve({ status: 'failed' as const })],
    ['a failed request', () => Promise.reject(new Error('IPC'))]
  ])('shows an error Toast for %s', async (_, result) => {
    tidder().contextMenu.download.mockImplementation(result)
    const error = vi.spyOn(toast, 'error')

    find(mediaMenuItems(VIDEO), 'Download').action()

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith('Download failed')
    })
  })

  it('shows nothing when the download is cancelled', async () => {
    const { download } = tidder().contextMenu
    download.mockResolvedValue({ status: 'cancelled' })
    const success = vi.spyOn(toast, 'success')
    const error = vi.spyOn(toast, 'error')

    find(mediaMenuItems(IMAGE, { x: 10, y: 20 }), 'Download').action()
    await download.mock.results[0].value

    expect(success).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  it('copies the image at the point', async () => {
    const success = vi.spyOn(toast, 'success')

    find(mediaMenuItems(IMAGE, { x: 10, y: 20 }), 'Copy').action()

    expect(tidder().contextMenu.copyImage).toHaveBeenCalledWith(10, 20)
    await vi.waitFor(() => {
      expect(success).toHaveBeenCalledWith('Image copied')
    })
  })

  it('reports an image it couldn\'t copy', async () => {
    tidder().contextMenu.copyImage.mockRejectedValue(new Error('IPC'))
    const error = vi.spyOn(toast, 'error')

    find(mediaMenuItems(IMAGE, { x: 10, y: 20 }), 'Copy').action()

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith('Couldn\'t copy the image')
    })
  })

  it.each([
    ['image', mediaMenuItems(IMAGE, { x: 10, y: 20 }), IMAGE.url],
    ['video', mediaMenuItems(VIDEO), VIDEO.url],
    [
      'embed',
      embedMenuItems(post({ url: 'https://youtu.be/abc' })),
      'https://youtu.be/abc'
    ]
  ])('copies the %s\'s link', (_, items, url) => {
    const success = vi.spyOn(toast, 'success')

    find(items, 'Copy URL').action()

    expect(tidder().contextMenu.writeText).toHaveBeenCalledWith(url)
    expect(success).toHaveBeenCalledWith('Link copied')
  })

  it('lists only Copy URL for an embed', () => {
    expect(labels(embedMenuItems(post()))).toEqual(['Copy URL'])
  })
})
