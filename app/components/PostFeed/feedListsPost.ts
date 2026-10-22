// Whether a feed lists a post, given whether the post is
// hidden, with the user's changes applied (see useThing).
// The Saved feed keeps hidden posts, as Reddit does, and
// the Hidden feed lists nothing else. Every other feed
// leaves them out.
export function feedListsPost(
  feedSource: string,
  hidden: boolean
): boolean {
  if (feedSource === 'saved') return true
  if (feedSource === 'hidden') return hidden

  return !hidden
}
