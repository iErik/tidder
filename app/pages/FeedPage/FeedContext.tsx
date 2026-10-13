import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode
} from 'react';

// What the feed on a page shows. FeedPage sets the source from the route;
// the filters above the feed set the search query and sort mode.

export interface FeedState {
  displaySub: boolean;
  searchQuery: string;
  feedSource: string;
  sortMode: string;
}

type FeedAction =
  | { type: 'setSearchQuery'; query: string }
  | { type: 'setSortMode'; sort: string }
  | { type: 'setSource'; source: string; resetQuery: boolean };

const initialState: FeedState = {
  displaySub: true,
  searchQuery: '',
  feedSource: '',
  sortMode: 'hot'
};

// Searches sort by relevance by default; leaving a search goes back to hot.
function withQuery(state: FeedState, query: string): FeedState {
  const wasSearching = !!state.searchQuery.trim();
  const isSearching = !!query.trim();
  let sortMode = state.sortMode;

  if (isSearching && !wasSearching)
    sortMode = 'relevance';
  else if (!isSearching && sortMode !== 'hot')
    sortMode = 'hot';

  return { ...state, searchQuery: query, sortMode };
}

function reducer(state: FeedState, action: FeedAction): FeedState {
  switch (action.type) {
    case 'setSearchQuery':
      return withQuery(state, action.query);
    case 'setSortMode':
      return { ...state, sortMode: action.sort };
    case 'setSource': {
      const next = { ...state, feedSource: action.source };
      return action.resetQuery ? withQuery(next, '') : next;
    }
  }
}

interface FeedContextValue extends FeedState {
  setSearchQuery(query: string): void;
  setSortMode(sort: string): void;
  setSource(source: string, resetQuery: boolean): void;
}

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setters = useMemo(() => ({
    setSearchQuery: (query: string) => dispatch({
      type: 'setSearchQuery',
      query
    }),
    setSortMode: (sort: string) => dispatch({
      type: 'setSortMode',
      sort
    }),
    setSource: (source: string, resetQuery: boolean) =>
      dispatch({ type: 'setSource', source, resetQuery })
  }), []);

  const value = useMemo(
    () => ({ ...state, ...setters }),
    [state, setters]
  );

  return (
    <FeedContext.Provider value={value}>
      {children}
    </FeedContext.Provider>
  )
}

export function useFeedState(): FeedContextValue {
  const value = useContext(FeedContext);

  if (!value)
    throw new Error('useFeedState() must be used inside a FeedProvider');

  return value;
}
