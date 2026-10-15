import {
  redditFetch,
  throwOnJsonErrors,
  type JsonResponse
} from 'api/client'
import type {
  CommentThing,
  ListingResponse,
  MoreThing,
  Post,
  PostThing,
} from 'api/types'

const PAGE_SIZE = 15

// Reddit accepts at most 100 comment ids per /api/morechildren request.
const MORE_CHILDREN_LIMIT = 100

export async function getPosts(
  sort: string,
  sr: string,
  after: string,
  signal?: AbortSignal
) {
  const path = sr ? `/r/${sr}/${sort}/.json` : `/${sort}/.json`
  const res = await redditFetch<ListingResponse<PostThing>>(
    path,
    { params: { after, limit: PAGE_SIZE }, signal })

  return res.data
}

export async function getSavedPosts(
  userName: string,
  after: string,
  signal?: AbortSignal
) {
  const res = await redditFetch<ListingResponse<PostThing>>(
    `/user/${userName}/saved`,
    { params: { after, limit: PAGE_SIZE, type: 'link' }, signal })

  return res.data
}

export async function searchPosts(
  q: string,
  sort: string,
  sr: string,
  after: string,
  signal?: AbortSignal
) {
  const path = sr ? `/r/${sr}/search.json` : '/search.json'
  const params = {
    q,
    sort,
    after,
    limit: PAGE_SIZE,
    restrict_sr: sr ? 'on' : null
  }
  const res = await redditFetch<ListingResponse<PostThing>>(
    path,
    { params, signal })

  return res.data
}

export interface CommentsPage {
  post: Post
  comments: CommentThing[]
  more: MoreThing | null
}

export async function getPostComments(
  sr: string,
  postId: string,
  sort: string,
  signal?: AbortSignal
): Promise<CommentsPage> {
  const params = {
    sr_detail: false,
    showmore: true,
    depth: 20,
    context: 8,
    sort
  }
  const [postListing, commentListing] = await redditFetch<
    [ListingResponse<PostThing>, ListingResponse<CommentThing | MoreThing>]
  >(`/r/${sr}/comments/${postId}/.json`, { params, signal })

  const children = commentListing.data.children

  return {
    post: postListing.data.children[0].data,
    comments: children.filter((c): c is CommentThing => c.kind === 't1'),
    more: children.find((c): c is MoreThing => c.kind === 'more') ?? null
  }
}

// Loads the comments hidden behind a "load more comments" entry. Reddit
// returns them as a flat list, which is rebuilt into reply trees here.
export async function getMoreComments(
  linkName: string,
  more: MoreThing,
  sort: string
): Promise<{ comments: CommentThing[]; more: MoreThing | null }> {
  const requested = more.data.children.slice(0, MORE_CHILDREN_LIMIT)
  const remaining = more.data.children.slice(MORE_CHILDREN_LIMIT)

  const res = await redditFetch<
    JsonResponse<{ things: (CommentThing | MoreThing)[] }>
  >(
    '/api/morechildren.json',
    {
      params: {
        link_id: linkName,
        children: requested.join(','),
        sort,
        limit_children: false
      }
    })

  const things = throwOnJsonErrors(res)?.things ?? []
  const { roots, more: nextMore } = unflattenComments(things)
  const leftover = [...remaining, ...(nextMore?.data.children ?? [])]

  return {
    comments: roots,
    more: leftover.length > 0
      ? {
        kind: 'more',
        data: {
          ...more.data,
          children: leftover,
          count: leftover.length
        }
      }
      : null
  }
}

// Nests each comment under its parent when the parent is in the same
// batch. Comments whose parent isn't in the batch are the top of the tree.
function unflattenComments(things: (CommentThing | MoreThing)[]) {
  const byName = new Map<string, CommentThing>()
  const roots: CommentThing[] = []
  let more: MoreThing | null = null

  for (const thing of things)
    if (thing.kind === 't1')
      byName.set(thing.data.name,
        { ...thing, data: { ...thing.data, replies: '' } })

  for (const thing of things) {
    const parent = byName.get(thing.data.parent_id)
    const node = thing.kind === 't1' ? byName.get(thing.data.name)! : thing

    if (parent) {
      if (!parent.data.replies)
        parent.data.replies = {
          kind: 'Listing',
          data: { after: null, before: null, children: [] }
        }

      parent.data.replies.data.children.push(node)
    } else if (node.kind === 't1') {
      roots.push(node)
    } else {
      more = node
    }
  }

  return { roots, more }
}

export interface NewPost {
  kind: 'link' | 'self'
  title: string
  sr: string
  url?: string
  text?: string
}

export async function submitPost(post: NewPost): Promise<{ url: string }> {
  const res = await redditFetch<JsonResponse<{ url: string }>>('/api/submit',
    { method: 'POST', params: { ...post } })

  return throwOnJsonErrors(res)!
}

export async function submitComment(
  thingId: string,
  text: string
): Promise<CommentThing> {
  const res = await redditFetch<
    JsonResponse<{ things: CommentThing[] }>
  >('/api/comment',
    { method: 'POST', params: { thing_id: thingId, text } })

  return throwOnJsonErrors(res)!.things[0]
}

export function setSaved(id: string, saved: boolean): Promise<unknown> {
  return redditFetch(saved ? '/api/save' : '/api/unsave',
    { method: 'POST', params: { id } })
}

// dir: 1 upvotes, -1 downvotes, 0 removes the vote.
export function vote(id: string, dir: -1 | 0 | 1): Promise<unknown> {
  return redditFetch('/api/vote', { method: 'POST', params: { id, dir } })
}

export type ReportReason =
  | { site_reason: string }
  | { rule_reason: string }

export async function reportThing(
  thingId: string,
  reason: ReportReason
): Promise<void> {
  const res = await redditFetch<JsonResponse<unknown>>('/api/report',
    { method: 'POST', params: { ...reason, thing_id: thingId } })

  throwOnJsonErrors(res)
}
