import { createStore, applyMiddleware, compose } from 'redux'

import { electronEnhancer } from 'redux-electron-store'
import { createLogger } from 'redux-logger'

import { routerMiddleware } from 'react-router-redux'

import createRootReducer from '../reducers'

const logger = createLogger({ level: 'info', collapsed: true })

const defaultFilter = {
  routing: true,
  ui: true
}

export default function configureStore(scope = 'main', filter = defaultFilter) {
  const composeEnhancers = scope === 'renderer'
    ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
    : compose;

  if (scope === 'renderer')
    var history = require('./hashHistory')

  const router = scope === 'main' ? undefined : routerMiddleware(history)
  const reducer = createRootReducer(scope)
  const middleware = [router, logger]

  const enhancer = scope === 'main'
    ? composeEnhancers(
        applyMiddleware(...middleware),
        electronEnhancer({ dispatchProxy: a => store.dispatch(a) })
      )
    : composeEnhancers(
        applyMiddleware(...middleware),
        electronEnhancer({ filter, dispatchProxy: a => store.dispatch(a) })
      );

  const store = createStore(reducer, enhancer)

  if (scope === 'renderer' && (module as any).hot) {
    (module as any).hot.accept('../reducers', () =>
      store.replaceReducer(require('../reducers'))
    );
  }

  return store
}
