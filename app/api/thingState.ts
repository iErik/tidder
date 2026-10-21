import { createStore } from 'core/createStore'
import { queryClient } from 'core/queryClient'

import * as posts from 'api/posts'
import * as subreddits from 'api/subreddits'
import type { ReportReason } from 'api/posts'

// The user's changes to things Reddit sent (votes, saves,
// hides, reports and subscriptions), keyed by fullname.
// The same post can be shown by several components at once,
// such as a feed card and the post viewer, each with its
// own copy of Reddit's data; reading these through
// useThing() keeps them in step. Changes are applied
// immediately and undone if Reddit rejects them.

export interface ThingChanges {
  likes?: boolean | null
  saved?: boolean
  hidden?: boolean
  reported?: boolean
  user_is_subscriber?: boolean
}

const changes = createStore<Record<string, ThingChanges>>({ })

function update(name: string, patch: ThingChanges): void {
  changes.set((all) => ({
    ...all,
    [name]: { ...all[name], ...patch }
  }))
}

// The fields optimistic() writes. Each thing's field has at
// most one request in flight; writes made meanwhile wait,
// and only the latest of them is sent once it settles.
type Field = Exclude<keyof ThingChanges, 'reported'>
type Value = ThingChanges[Field]

interface Write {
  value: Value
  request: () => Promise<unknown>
  // The resolvers of this write and of the writes it replaced
  resolvers: ((accepted: boolean) => void)[]
}

// Present while a request for the field is in flight
interface Pending {
  confirmed: Value
  waiting?: Write
}

// Keyed by `${fullname} ${field}`. Replaced on logout, so a
// late response can tell that its entry is gone.
let pending = new Map<string, Pending>()

function settle(write: Write, accepted: boolean): void {
  write.resolvers.forEach((resolve) => resolve(accepted))
}

const mkFieldKey = (name: string, field: Field) =>
  `${name} ${field}`

// Sends `write`, then, once it settles, the write that waited
// for it (by calling itself), until none is left.
async function send(
  name: string,
  field: Field,
  entry: Pending,
  write: Write
): Promise<void> {
  let accepted = true

  try {
    await write.request()
  } catch (err) {
    console.error(err)
    accepted = false
  }

  const key = mkFieldKey(name, field)

  // clearThingChanges() replaces `pending` on logout, so
  // if this entry isn't in it any more, the user logged out
  // while the request was in flight. The write still
  // resolves, but nothing is written back to the store
  // logout cleared.
  if (pending.get(key) !== entry)
    return settle(write, accepted)

  if (accepted) entry.confirmed = write.value
  settle(write, accepted)

  const next = entry.waiting
  entry.waiting = undefined

  // A newer write is sent only if it would change what
  // Reddit has
  if (next && next.value !== entry.confirmed)
    return send(name, field, entry, next)

  pending.delete(key)
  // The newer write asks for what Reddit already has
  if (next)
    settle(next, true)
  // Nothing newer, and Reddit rejected this one: undo it
  else if (!accepted)
    update(name, { [field]: entry.confirmed })
}

// Shows `value` right away and sends the request in turn
// with the field's other writes. If Reddit rejects it, and
// no newer write is waiting, the field goes back to the
// last value Reddit confirmed. Resolves to whether Reddit
// accepted it, or for a write replaced before it was sent,
// the write that replaced it.
function optimistic<T extends { name: string }>(
  thing: T,
  field: Field,
  value: Value,
  request: () => Promise<unknown>
): Promise<boolean> {
  const key = mkFieldKey(thing.name, field)
  const stored = changes.get()[thing.name]
  const entry = pending.get(key)

  update(thing.name, { [field]: value })

  return new Promise((resolve) => {
    const write: Write = {
      value,
      request,
      resolvers: [resolve]
    }

    if (entry) {
      write.resolvers.unshift(...entry.waiting?.resolvers ?? [])
      entry.waiting = write
      return
    }

    // With nothing in flight, the store holds confirmed
    // values
    const created: Pending = {
      confirmed: stored && field in stored
        ? stored[field]
        : thing[field as keyof T] as Value
    }

    pending.set(key, created)
    void send(thing.name, field, created, write)
  })
}

// `thing` with the user's changes applied.
export function useThing<T extends { name: string }>(
  thing: T
): T {
  const thingChanges = changes.useStore(
    (all) => all[thing.name]
  )

  return thingChanges
    ? { ...thing, ...thingChanges }
    : thing
}

// dir: 1 upvotes, -1 downvotes, 0 removes the vote.
export function voteThing(
  thing: { name: string },
  dir: -1 | 0 | 1
): Promise<boolean> {
  const likes = dir === 0 ? null : dir > 0
  return optimistic(thing, 'likes', likes,
    () => posts.vote(thing.name, dir))
}

export function saveThing(
  thing: { name: string },
  saved: boolean
): Promise<boolean> {
  return optimistic(thing, 'saved', saved,
    () => posts.setSaved(thing.name, saved))
}

// The feeds leave out hidden posts (see PostFeed)
export function hideThing(
  thing: { name: string },
  hidden: boolean
): Promise<boolean> {
  return optimistic(thing, 'hidden', hidden,
    () => posts.setHidden(thing.name, hidden))
}

// Unlike the others, a report is only marked once Reddit
// accepts it, and errors are passed on to the report form.
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
  await optimistic(sub, 'user_is_subscriber', subscribed,
    () => subreddits.subscribe(
      sub.name,
      subscribed ? 'sub' : 'unsub'
    ))

  // The sidebar lists the user's subscriptions.
  void queryClient.invalidateQueries({
    queryKey: ['subscriptions']
  })
}

// On logout. Waiting writes are dropped and resolve to
// false, and responses to requests in flight leave the
// store alone.
export function clearThingChanges(): void {
  const dropped = pending
  pending = new Map()
  dropped.forEach((entry) => {
    if (entry.waiting) settle(entry.waiting, false)
  })

  changes.set({ })
}
