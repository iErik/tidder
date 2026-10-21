import { useSyncExternalStore } from 'react'

// A value kept at module level, so code outside React can read
// and change it, and that components read with useStore().
// Each module creates its store once, at import time.

export interface Store<T> {
  get(): T

  // Replaces the value and notifies every subscriber, even when
  // the new value is the same.
  set(next: T | ((prev: T) => T)): void

  subscribe(listener: () => void): () => void

  // The selector form re-renders only when what it returns
  // changes by reference, so it must return a stable value
  // (a part of the state, not a newly built object).
  useStore(): T
  useStore<S>(select: (state: T) => S): S
}

// `T` can't be a function, since `set` takes one as an updater.
export function createStore<T>(initial: T): Store<T> {
  let state = initial
  const listeners = new Set<() => void>()

  const get = () => state

  function set(next: T | ((prev: T) => T)): void {
    state = typeof next === 'function'
      ? (next as (prev: T) => T)(state)
      : next

    listeners.forEach((listener) => listener())
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function useStore(): T
  function useStore<S>(select: (state: T) => S): S
  function useStore<S>(select?: (state: T) => S): T | S {
    return useSyncExternalStore<T | S>(
      subscribe,
      select ? () => select(state) : get
    )
  }

  return { get, set, subscribe, useStore }
}
