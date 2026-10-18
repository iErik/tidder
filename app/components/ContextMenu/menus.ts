import type { MouseEvent } from 'react'

import { hideThing, saveThing } from 'api/thingState'
import type { Identity, Post } from 'api/types'

import { openContextMenu } from 'core/contextMenu'
import type { ContextMenuItem } from 'core/contextMenu'
import { toast } from 'core/toasts'
import type { FeedAction } from 'pages/FeedPage/FeedPage'

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
