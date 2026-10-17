import type { CommentThing } from 'api/types'

// The top-level comments to show: the user's own new comments first, then
// the thread Reddit sent, then the comments loaded from behind "load more".
// A submitted comment Reddit has since included is only shown where Reddit
// put it.
export function mergeComments(
  submitted: CommentThing[],
  thread: CommentThing[],
  loaded: CommentThing[]
): CommentThing[] {
  const fromReddit = [...thread, ...loaded]
  const names = new Set(fromReddit.map((comment) => comment.data.name))

  return [
    ...submitted.filter((comment) => !names.has(comment.data.name)),
    ...fromReddit
  ]
}
