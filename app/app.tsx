import 'react-hot-loader'

import * as React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { Route } from 'react-router-dom'

import { ConnectedRouter } from 'react-router-redux'
import configureStore from 'store/configureStore'
import hashHistory from 'store/hashHistory'
import styles from 'styles/index.sass'

//import RootLayout from 'containers/RootLayout'
import RootLayout from 'layouts/RootLayout'

//const store = configureStore('renderer')

render(
  <RootLayout />
, document.getElementById('app')
)
