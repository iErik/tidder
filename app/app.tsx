import * as React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { Route } from 'react-router-dom'

import { ConnectedRouter } from 'connected-react-router'
import initStore from 'store/initStore'
import createHistory from 'store/hashHistory'
import styles from 'styles/index.sass'

import RootLayout from 'layouts/RootLayout'

const store = initStore('renderer')

render(
  <Provider store={ store }>
    <ConnectedRouter history={ createHistory('renderer') }>
      <Route path="/" component={ RootLayout } />
    </ConnectedRouter>
  </Provider>
, document.getElementById('app')
)
