import * as React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { Route } from 'react-router-dom'
import { ConnectedRouter } from 'connected-react-router'

import RootLayout from '@containers/RootLayout'
import createHistory from '@store/hashHistory'
import initStore from '@store/initStore'
import '@styles'

const store = initStore('renderer')

render(
  <Provider store={ store }>
    <ConnectedRouter history={ createHistory('renderer') }>
      <Route path="/" store={ store } component={ RootLayout } />
    </ConnectedRouter>
  </Provider>
, document.getElementById('app')
)
