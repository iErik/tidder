import { connectRouter } from 'connected-react-router'
import { reducer as uiReducer } from 'redux-ui'
import { combineReducers } from 'redux'

import createHistory from '../hashHistory'

import dummyReducer from './dummyReducer'

export default function createRootReducer(scope: string = 'main') {
  return scope === 'main'
  ? combineReducers({
    router: connectRouter(createHistory(scope)),
    dummy: dummyReducer
  })
  : combineReducers({
    router: connectRouter(createHistory(scope)),
    dummy: dummyReducer,
    ui: uiReducer
  })
}
