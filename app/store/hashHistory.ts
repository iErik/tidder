import { createBrowserHistory, createMemoryHistory } from 'history'

export default (scope = 'renderer') => {
  return scope === 'renderer'
    ? createBrowserHistory()
    : createMemoryHistory()
}
