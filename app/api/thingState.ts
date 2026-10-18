import { useSyncExternalStore } from 'react'

import { queryClient } from 'core/queryClient'

import * as posts from 'api/posts'
import * as subreddits from 'api/subreddits'
import type { ReportReason } from 'api/posts'

// The user's changes to things Reddit sent (votes, saves, hides, reports
// and subscriptions), keyed by fullname. The same post can be shown by several
// components at once, such as a feed card and the post viewer, each with
// its own copy of Reddit's data; reading these through useThing() keeps
// them in step. Changes are applied immediately and undone if Reddit
// rejects them.

export interface ThingChanges {
  likes?: boolean | null
  saved?: boolean
  hidden?: boolean
  reported?: boolean
  user_is_subscriber?: boolean
}

let changes: Record<string, ThingChanges> = { }
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function update(name: string, patch: ThingChanges): void {
  changes = { ...changes, [name]: { ...changes[name], ...patch } }
  listeners.forEach((listener) => listener())
}

// Applies `patch` right away, then reverts to the previous values if the
// request fails. Resolves to whether Reddit accepted it.
async function optimistic<T extends { name: string }>(
  thing: T,
  patch: ThingChanges,
  request: () => Promise<unknown>
): Promise<boolean> {
  const previous = { ...changes[thing.name] }
  const reverted = Object.fromEntries(Object.keys(patch).map((key) =>
    [key, key in previous
      ? previous[key as keyof ThingChanges]
      : thing[key as keyof T]]))

  update(thing.name, patch)

  try {
    await request()
    return true
  } catch (err) {
    console.error(err)
    update(thing.name, reverted)
    return false
  }
}

// `thing` with the user's changes applied.
export function useThing<T extends { name: string }>(thing: T): T {
  const thingChanges = useSyncExternalStore(subscribe,
    () => changes[thing.name])
  return thingChanges ? { ...thing, ...thingChanges } : thing
}

// dir: 1 upvotes, -1 downvotes, 0 removes the vote.
export function voteThing(
  thing: { name: string },
  dir: -1 | 0 | 1
): Promise<boolean> {
  const likes = dir === 0 ? null : dir > 0
  return optimistic(thing, { likes }, () => posts.vote(thing.name, dir))
}

export function saveThing(
  thing: { name: string },
  saved: boolean
): Promise<boolean> {
  return optimistic(thing, { saved }, () => posts.setSaved(thing.name, saved))
}

// The feeds leave out hidden posts (see PostFeed)
export function hideThing(
  thing: { name: string },
  hidden: boolean
): Promise<boolean> {
  return optimistic(thing, { hidden },
    () => posts.setHidden(thing.name, hidden))
}

// Unlike the others, a report is only marked once Reddit accepts it, and
// errors are passed on to the report form.
export async function reportThing(
  thing: { name: string },
  reason: ReportReason
): Promise<void> {
  await posts.reportThing(thing.name, reason)
  update(thing.name, { reported: true })
}

export async function setSubscribed(
  sub: { name: string },
  subscribed: boolean
): Promise<void> {
  await optimistic(sub, { user_is_subscriber: subscribed },
    () => subreddits.subscribe(sub.name, subscribed ? 'sub' : 'unsub'))

  // The sidebar lists the user's subscriptions.
  void queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
}

export function clearThingChanges(): void {
  changes = { }
  listeners.forEach((listener) => listener())
}
