import { useEffect, useMemo, useState } from 'react'

import type { FeedParams } from 'api/queries'

import { useFeedState } from 'pages/FeedPage/FeedContext'

// How long typing in the search bar (or changing the sort)
// has to pause before the feed reloads.
const FILTER_DELAY = 300

// The feed params, with changes to the search and sort
// applied once they settle. A new source (navigating to
// another feed) applies at once.
export function useSettledFeedParams(): FeedParams {
  const {
    feedSource,
    sortMode,
    searchQuery
  } = useFeedState()

  const live = useMemo(
    () => ({
      source: feedSource,
      sort: sortMode,
      query: searchQuery
    }),
    [feedSource, sortMode, searchQuery])

  const [settled, setSettled] = useState(live)

  useEffect(() => {
    if (live.source !== settled.source) {
      // A new source skips the debounce. Settling it during
      // render instead would mean restructuring this hook.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettled(live)
      return
    }

    const timer = setTimeout(
      () => setSettled(live),
      FILTER_DELAY)

    return () => clearTimeout(timer)
  }, [live, settled.source])

  return settled
}
