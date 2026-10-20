import type { MouseEvent } from 'react'

import { hideThing, saveThing } from 'api/thingState'
import type { Identity, Post } from 'api/types'

import { openContextMenu } from 'core/contextMenu'
import type { ContextMenuItem } from 'core/contextMenu'
import { toast } from 'core/toasts'
import type { FeedAction } from 'pages/FeedPage/FeedPage'
import { downloadName } from 'utils/downloadName'

import type { MenuTarget } from './target'

// The items each menu shows. Plain functions of what was
// right-clicked, so they can be tested without rendering.

// The items, plus Inspect at the point in dev mode only
export function withInspect(
  items: readonly ContextMenuItem[],
  x: number,
  y: number
): ContextMenuItem[] {
  if (!window.tidder.isDev) return [...items]

  return [...items, {
    label: 'Inspect',
    action: () => window.tidder.contextMenu.inspect(x, y)
  }]
}

// Anywhere no component has its own menu for
export function defaultMenuItems(
  x: number,
  y: number
): ContextMenuItem[] {
  return withInspect([], x, y)
}

// Selected text, right-clicked on the selection
export function selectionMenuItems(text: string): ContextMenuItem[] {
  return [{ label: 'Copy text', action: () => copyText(text) }]
}

// A link, at its absolute URL. `text` is the link's, or the
// selection it's in.
export function linkMenuItems(
  url: string,
  text: string
): ContextMenuItem[] {
  return [
    {
      label: 'Open in browser',
      action: () => window.tidder.openExternal(url)
    },
    { label: 'Copy link', action: () => copyLink(url) },
    { label: 'Copy text', action: () => copyText(text) }
  ]
}

// A target no component in the page opens the menu for (see
// pickTarget), with Inspect in dev mode
export function targetMenuItems(
  target: Exclude<MenuTarget, { type: 'page' }>,
  x: number,
  y: number
): ContextMenuItem[] {
  const items = target.type === 'link'
    ? linkMenuItems(target.url, target.text)
    : selectionMenuItems(target.text)

  return withInspect(items, x, y)
}

// Opens a component's menu at the right-click, with Inspect
// in dev mode
export function openMenu(
  event: MouseEvent,
  items: readonly ContextMenuItem[]
): void {
  const { clientX: x, clientY: y } = event
  openContextMenu(x, y, withInspect(items, x, y))
}

interface PostMenuOptions {
  user: Identity | null
  onFeedAction: (action: FeedAction) => void

  // In the post viewer, where the post is already open
  inViewer?: boolean
}

// A post, in the feed or the viewer. `post` has the user's
// changes applied (see useThing).
export function postMenuItems(
  post: Post,
  { user, onFeedAction, inViewer = false }: PostMenuOptions
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [
    {
      label: 'Open in browser',
      action: () => window.tidder
        .openExternal(`https://www.reddit.com${post.permalink}`)
    },
    { label: 'Hide', action: () => void hide(post) },
    {
      label: post.saved ? 'Unsave' : 'Save',
      action: () => void toggleSaved(post)
    },
    {
      label: 'Report',
      disabled: post.reported || user?.name === post.author,
      action: () => onFeedAction({ type: 'report', thing: post })
    },
    {
      label: 'Share',
      action: () => onFeedAction({ type: 'share', thing: post })
    }
  ]

  if (!inViewer) items.push({
    label: 'View',
    action: () => onFeedAction({ type: 'open', thing: post })
  })

  return items
}

interface Media {
  url: string
  // The post's, for the download's file name
  title: string
}

interface Point {
  x: number
  y: number
}

// An image or video in the viewer. Electron copies the image
// at a point in the window, so `copyAt` is where an image was
// clicked; without one, as for a video, Copy is disabled
export function mediaMenuItems(
  media: Media,
  copyAt?: Point
): ContextMenuItem[] {
  return [
    { label: 'Download', action: () => void download(media) },
    {
      label: 'Copy',
      disabled: !copyAt,
      action: () => {
        if (copyAt) void copyImage(copyAt.x, copyAt.y)
      }
    },
    { label: 'Copy URL', action: () => copyLink(media.url) }
  ]
}

// An embedded player: the post's link, not the embed's
export function embedMenuItems(post: Post): ContextMenuItem[] {
  return [
    { label: 'Copy URL', action: () => copyLink(post.url) }
  ]
}

async function download({ url, title }: Media) {
  const result = await window.tidder.contextMenu
    .download(url, downloadName(title, url))
    .catch(() => ({ status: 'failed' }) as const)

  if (result.status === 'saved')
    toast.success(`Downloaded ${result.fileName}`)
  else if (result.status === 'failed')
    toast.error('Download failed')
}

// Electron reports nothing back, so only a failed request
// shows the error
async function copyImage(x: number, y: number) {
  try {
    await window.tidder.contextMenu.copyImage(x, y)
    toast.success('Image copied')
  } catch {
    toast.error('Couldn\'t copy the image')
  }
}

function copyLink(url: string) {
  window.tidder.contextMenu.writeText(url)
  toast.success('Link copied')
}

function copyText(text: string) {
  window.tidder.contextMenu.writeText(text)
  toast.success('Text copied')
}

async function hide(post: Post) {
  if (await hideThing(post, true)) toast.success('Post hidden')
  else toast.error('Couldn\'t hide the post')
}

async function toggleSaved(post: Post) {
  const saved = !post.saved
  const done = await saveThing(post, saved)
  const verb = saved ? 'save' : 'unsave'

  if (done) toast.success(`Post ${verb}d`)
  else toast.error(`Couldn't ${verb} the post`)
}
