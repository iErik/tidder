import { redditFetch } from 'api/client'
import type { ListingResponse, Multireddit, PostThing, Thing } from 'api/types'

// Multireddit feed sources look like `/user/<userName>/m/<multiName>/`.
export const MULTI_PATH = /^\/user\/([\w-]+)\/m\/(\w+)\/$/

function multiFeedPath(multiPath: string): string {
  const [, userName, multiName] = multiPath.match(MULTI_PATH)!
  return `/user/${userName}/m/${multiName}`
}

export async function getMultiFeed(multiPath: string, sort: string, after: string, signal?: AbortSignal) {
  const res = await redditFetch<ListingResponse<PostThing>>(`${multiFeedPath(multiPath)}/${sort}/.json`,
    { params: { after, limit: 15 }, signal })

  return res.data
}

export async function searchMultiFeed(
  multiPath: string, q: string, sort: string, after: string, signal?: AbortSignal
) {
  const params = { q, sort, after, limit: 15, include_over_18: 'on', restrict_sr: 'on' }
  const res = await redditFetch<ListingResponse<PostThing>>(`${multiFeedPath(multiPath)}/search.json`,
    { params, signal })

  return res.data
}

export async function getUserMultis(signal?: AbortSignal): Promise<Multireddit[]> {
  const res = await redditFetch<Thing<'LabeledMulti', Multireddit>[]>('/api/multi/mine',
    { params: { expand_srs: false }, signal })

  return res.map((multi) => multi.data)
}
