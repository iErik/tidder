import { useSyncExternalStore } from 'react'

import type { IconName } from 'components/Icon/Icon'

// Toasts: short messages shown in the corner of the window to
// report the outcome of something the user did. A module-level
// store, so code outside React (the query client, thingState)
// can fire them too; the Toaster renders the stack.

export type ToastType = 'error' | 'warning' | 'success'
export type ToastId = number

export interface ToastOptions {
  icon?: IconName

  // Milliseconds before the Toast closes on its own. Left out,
  // the configured default; 0 or null, it stays until dismissed.
  duration?: number | null
}

export interface ToastInput extends ToastOptions {
  type: ToastType
  message: string
}

export interface Toast {
  id: ToastId
  type: ToastType
  message: string
  icon: IconName

  // Fading out; removed from the store after FADE_DURATION.
  closing: boolean
}

export interface ToastConfig {
  duration?: number
  newestOnTop?: boolean
  icons?: Partial<Record<ToastType, IconName>>
}

// How long a Toast takes to fade in or out, and how many can
// be open at once.
export const FADE_DURATION = 300
export const MAX_TOASTS = 5

const BUILT_IN_ICONS: Record<ToastType, IconName> = {
  error: 'information',
  warning: 'information',
  success: 'verify'
}

interface Timer {
  handle?: ReturnType<typeof setTimeout>
  remaining: number
  startedAt: number
}

let config: Required<ToastConfig> = {
  duration: 10 * 1000,
  newestOnTop: false,
  icons: { }
}

// Oldest first.
let toasts: readonly Toast[] = []
let nextId = 1

// Kept apart from the Toasts, since they never affect what's
// rendered. A Toast that never closes on its own has none.
const timers = new Map<ToastId, Timer>()
const listeners = new Set<() => void>()

function setToasts(next: readonly Toast[]): void {
  toasts = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function startTimer(id: ToastId, timer: Timer): void {
  timer.startedAt = Date.now()
  timer.handle = setTimeout(() => dismissToast(id), timer.remaining)
  timers.set(id, timer)
}

export function useToasts(): readonly Toast[] {
  return useSyncExternalStore(subscribe, () => toasts)
}

export function getToastConfig(): Readonly<Required<ToastConfig>> {
  return config
}

// Called once at startup.
export function configureToasts(options: ToastConfig): void {
  config = {
    ...config,
    ...options,
    icons: { ...config.icons, ...options.icons }
  }
}

export function toast(input: ToastInput): ToastId {
  const { type, message } = input
  const id = nextId++
  const icon = input.icon ?? config.icons[type] ?? BUILT_IN_ICONS[type]
  const duration = input.duration === undefined
    ? config.duration
    : input.duration

  // The oldest open Toast makes room for this one.
  const open = toasts.filter((item) => !item.closing)
  if (open.length >= MAX_TOASTS) dismissToast(open[0].id)

  setToasts([...toasts, { id, type, message, icon, closing: false }])

  if (duration) startTimer(id, { remaining: duration, startedAt: 0 })

  return id
}

function typed(type: ToastType) {
  return (message: string, options?: ToastOptions): ToastId =>
    toast({ ...options, type, message })
}

toast.error = typed('error')
toast.warning = typed('warning')
toast.success = typed('success')

// Closes the Toast with the usual fade-out.
export function dismissToast(id: ToastId): void {
  const target = toasts.find((item) => item.id === id)
  if (!target || target.closing) return

  clearTimeout(timers.get(id)?.handle)
  timers.delete(id)

  setToasts(toasts.map((item) =>
    item.id === id ? { ...item, closing: true } : item))

  setTimeout(() => {
    setToasts(toasts.filter((item) => item.id !== id))
  }, FADE_DURATION)
}

// Stops the Toast's timer while the pointer is over it, and
// restarts it with the time that was left.
export function pauseToast(id: ToastId): void {
  const timer = timers.get(id)
  if (timer?.handle === undefined) return

  clearTimeout(timer.handle)
  timer.handle = undefined
  timer.remaining -= Date.now() - timer.startedAt
}

export function resumeToast(id: ToastId): void {
  const timer = timers.get(id)
  if (!timer || timer.handle !== undefined) return

  startTimer(id, timer)
}

declare global {
  interface Window {
    // Dev builds only, for firing Toasts from the console.
    toast?: typeof toast
  }
}
