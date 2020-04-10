import * as React from 'react'
import './Topbar.sass'

import WindowControls from '@components/Layout/WindowControls'

export default class Topbar extends React.Component {
  render () {
    return (
      <div className="Topbar">
        <div className="Topbar-section -left">
          <div className="Topbar-controls">
            <div className="Topbar-control"></div>
            <div className="Topbar-control"></div>
          </div>
        </div>

        <div className="Topbar-center">
          <span className="Topbar-pageLabel">
            FRONTPAGE
          </span>
        </div>

        <div className="Topbar-section -right">
          <WindowControls />
        </div>
      </div>
    )
  }
}
