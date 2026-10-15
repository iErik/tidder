import { QueryClient } from '@tanstack/react-query'

import { RedditApiError } from 'api/client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is only refetched when the user asks for it (changing the
      // source, sort or search), not in the background while it's shown.
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,

      // A 401 triggers a token refresh (see api/client.ts), so one retry
      // gives the refreshed token a chance. Other client errors won't
      // succeed on retry.
      retry: (failureCount, error) => {
        if (error instanceof RedditApiError && error.status >= 400 && error.status < 500)
          return error.status === 401 && failureCount < 1

        return failureCount < 2
      },
      retryDelay: 1000
    },
    mutations: {
      onError: (error) => console.error(error)
    }
  }
})
