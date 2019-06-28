import { routerReducer } from 'react-router-redux'
import { reducer as uiReducer } from 'redux-ui'
import { combineReducers } from 'redux'

export default function createRootReducer(scope: string = 'main') {
  return scope === 'main'
  ? combineReducers({})
  : combineReducers({
    routing: routerReducer,
    ui: uiReducer
  })
}
