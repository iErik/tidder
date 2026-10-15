import { redditFetch } from 'api/client'
import type {
  ListingResponse,
  Subreddit,
  SubredditRule,
  SubredditThing,
} from 'api/types'

export async function getSubRules(srName: string, signal?: AbortSignal): Promise<SubredditRule[]> {
  const res = await redditFetch<{ rules: SubredditRule[] }>(`/r/${srName}/about/rules.json`, { signal })
  return res.rules ?? []
}

export async function searchSubs(q: string, sort: string, after: string, signal?: AbortSignal) {
  const res = await redditFetch<ListingResponse<SubredditThing>>('/search.json',
    { params: { q, type: 'sr', sort, after, limit: 15 }, signal })

  return res.data
}

// Subreddit names starting with `query`, for autocompletion.
export async function searchSubNames(query: string, signal?: AbortSignal): Promise<string[]> {
  const res = await redditFetch<{ names: string[] }>('/api/search_reddit_names.json',
    { method: 'POST', params: { query, exact: false, include_over_18: true }, signal })

  return res.names ?? []
}

// The subreddits the user is subscribed to, a page at a time.
export async function getUserSubs(after: string, signal?: AbortSignal) {
  const res = await redditFetch<ListingResponse<SubredditThing>>('/subreddits/mine/subscriber/.json',
    { params: { after, limit: 25 }, signal })

  return {
    after: res.data.after,
    children: res.data.children.map((sub): Subreddit => sub.data)
  }
}

export function subscribe(sr: string, action: 'sub' | 'unsub'): Promise<unknown> {
  return redditFetch('/api/subscribe', { method: 'POST', params: { sr, action } })
}
