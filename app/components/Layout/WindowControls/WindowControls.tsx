import * as React from 'react'
import './WindowControls.sass'

export default class WindowControls extends React.Component {
  render () {
    return (
      <div className="WindowControls">
        <button className="WindowControls-btn --maximize"></button>
        <button className="WindowControls-btn --minimize"></button>
        <button className="WindowControls-btn --close"></button>
      </div>
    )
  }
}
