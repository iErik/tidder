import type { CommentThing } from 'api/types'

// The user's own new comments that neither the thread Reddit sent nor the
// comments loaded from behind "load more" list yet. Reddit's num_comments
// doesn't count them either.
export function unlistedComments(
  submitted: CommentThing[],
  thread: CommentThing[],
  loaded: CommentThing[]
): CommentThing[] {
  const fromReddit = [...thread, ...loaded]
  const names = new Set(fromReddit.map((comment) => comment.data.name))

  return submitted.filter((comment) => !names.has(comment.data.name))
}

// The top-level comments to show: the user's own new comments first, then
// the thread Reddit sent, then the comments loaded from behind "load more".
// A submitted comment Reddit has since included is only shown where Reddit
// put it.
export function mergeComments(
  submitted: CommentThing[],
  thread: CommentThing[],
  loaded: CommentThing[]
): CommentThing[] {
  return [
    ...unlistedComments(submitted, thread, loaded),
    ...thread,
    ...loaded
  ]
}
