import authConfig from 'config/authConfig.json'

import { getAccessToken } from 'core/session'

// The app is only usable while logged in (Reddit blocks the public .json
// endpoints), so every request goes through the OAuth API.
const API_ROOT = authConfig.authBaseURI

export type Params = Record<
  string,
  string | number | boolean | null | undefined
>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Params
  signal?: AbortSignal
}

export class RedditApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'RedditApiError'
  }
}

// Set by AuthProvider: called when Reddit rejects the access token, so the
// session can be refreshed (or ended if that fails too).
let unauthorizedHandler: () => void = () => { }

export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler
}

function toSearchParams(params: Params): URLSearchParams {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params))
    if (value !== null && value !== undefined)
      search.set(key, String(value))

  return search
}

// GET parameters go in the query string; for other methods they're sent as
// a form body, which is what Reddit's API documents.
export async function redditFetch<T = unknown>(
  path: string,
  { method = 'GET', params = { }, signal }: RequestOptions = { }
): Promise<T> {
  const url = new URL(path, API_ROOT)
  const search = toSearchParams({ raw_json: 1, api_type: 'json', ...params })
  const headers: Record<string, string> = { }
  const token = getAccessToken()
  let body: URLSearchParams | undefined

  if (token)
    headers['Authorization'] = `Bearer ${token}`

  if (method === 'GET')
    url.search = search.toString()
  else
    body = search

  const res = await fetch(url, { method, headers, body, signal })

  if (!res.ok) {
    if (res.status === 401)
      unauthorizedHandler()

    throw new RedditApiError(res.status,
      `${res.status} ${res.statusText}`
      + ` (${method} ${url.pathname})`)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

// Responses to api_type=json calls wrap Reddit's own errors, which come as
// [code, message, field] triples, in a 200 response.
export interface JsonResponse<T> {
  json: { errors: [string, string, string?][]; data?: T }
}

export function throwOnJsonErrors<T>(res: JsonResponse<T>): T | undefined {
  const errors = res?.json?.errors ?? []

  if (errors.length > 0)
    throw new RedditJsonError(errors)

  return res?.json?.data
}

export class RedditJsonError extends Error {
  constructor(public errors: [string, string, string?][]) {
    super(errors.map(([, message]) => message).join('; '))
    this.name = 'RedditJsonError'
  }
}
