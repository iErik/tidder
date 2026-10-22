import {
  useInfiniteQuery,
  useQuery
} from '@tanstack/react-query'

import {
  getMultiFeed,
  getUserMultis,
  MULTI_PATH,
  searchMultiFeed
} from 'api/multis'

import {
  getHiddenPosts,
  getPostComments,
  getPosts,
  getSavedPosts,
  searchPosts
} from 'api/posts'

import {
  getSubRules,
  getUserSubs,
  searchSubNames,
  searchSubs
} from 'api/subreddits'

import type {
  Listing,
  Post,
  PostThing,
  Subreddit,
  SubredditThing
} from 'api/types'

import { useAuth } from 'core/auth'


// What the feed shows. `source` is one of:
//   'home', 'saved', 'hidden', 'r/<name>',
//   '/user/<user>/m/<multi>/',
//    or 'sr:', a search for subreddits instead of posts.
export interface FeedParams {
  source: string
  sort: string
  query: string
}

export interface FeedPage {
  after: string | null
  posts: Post[]
  subs: Subreddit[]
}

function fetchListing(
  { source, sort, query }: FeedParams,
  userName: string,
  after: string,
  signal: AbortSignal
): Promise<Listing<PostThing | SubredditThing>> {
  const sr = source.startsWith('r/') ? source.slice(2) : ''
  const isMulti = MULTI_PATH.test(source)

  // Search doesn't apply to the Hidden feed
  if (source === 'hidden')
    return getHiddenPosts(userName, after, signal)

  if (query.trim()) {
    if (source.startsWith('sr:'))
      return searchSubs(query, sort, after, signal)
    if (isMulti)
      return searchMultiFeed(source, query, sort, after, signal)

    return searchPosts(query, sort, sr, after, signal)
  }

  if (source === 'saved')
    return getSavedPosts(userName, after, signal)
  if (isMulti)
    return getMultiFeed(source, sort, after, signal)

  // 'home' and 'r/<name>'.
  return getPosts(sort, sr, after, signal)
}

export function useFeed(params: FeedParams) {
  // The saved and hidden feeds need the user's name, which
  // comes with the identity.
  const userName = useAuth().user?.name ?? ''
  const needsUser = params.source === 'saved' ||
    params.source === 'hidden'

  return useInfiniteQuery({
    queryKey: [
      'feed',
      params,
      needsUser ? userName : null
    ],
    queryFn: async ({
      pageParam,
      signal
    }): Promise<FeedPage> => {
      const listing = await fetchListing(
        params,
        userName,
        pageParam,
        signal
      )

      return {
        after: listing.after,
        posts: listing.children
          .filter((c): c is PostThing => c.kind === 't3')
          .map((c) => c.data),
        subs: listing.children
          .filter((c): c is SubredditThing =>
            c.kind === 't5')
          .map((c) => c.data)
      }
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) =>
      lastPage.after ?? undefined,

    // Coming back to a feed loads it afresh
    gcTime: 0,

    // FeedPage sets the source from the route after
    // mounting.
    enabled: !!params.source && (!needsUser || !!userName)
  })
}

export function useComments(post: Post, sort: string) {
  return useQuery({
    queryKey: ['comments', post.name, sort],
    queryFn: ({ signal }) => getPostComments(
      post.subreddit,
      post.id,
      sort,
      signal
    ),
    gcTime: 0
  })
}

export function useSubscriptions() {
  return useInfiniteQuery({
    queryKey: ['subscriptions'],
    queryFn: ({ pageParam, signal }) =>
      getUserSubs(pageParam, signal),
    initialPageParam: '',
    getNextPageParam: (lastPage) =>
      lastPage.after ?? undefined
  })
}

export function useMultis() {
  return useQuery({
    queryKey: ['multis'],
    queryFn: ({ signal }) => getUserMultis(signal)
  })
}

export function useSubRules(srName: string) {
  return useQuery({
    queryKey: ['subRules', srName],
    queryFn: ({ signal }) => getSubRules(srName, signal)
  })
}

export function useSubNameSuggestions(query: string) {
  return useQuery({
    queryKey: ['subNames', query],
    queryFn: ({ signal }) => searchSubNames(query, signal),
    enabled: !!query,
    retry: false
  })
}
