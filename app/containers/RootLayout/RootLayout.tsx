import * as React from 'react'
import { connect } from 'react-redux'
import { Switch, Route, Redirect } from 'react-router-dom'

import Topbar from '@components/Layout/Topbar'
import Sidebar from '@components/Layout/Sidebar'


@(connect(state => ({ })) as any)
export default class RootLayout extends React.Component {
  render() {
    return (
      <div className="root -full-size">
        <Topbar />
        <Sidebar />

        <div className="content">
        </div>
      </div>
    )
  }
}
