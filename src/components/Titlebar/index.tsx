import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import Button from '@components/Button'
import Icon from '@components/Icon'

import './styles.scss'

function WindowControls() {
  return (
    <div className="WindowControls">
      <Icon icon="Minimize" />
      <Icon icon="Maximize" />
      <Icon icon="Close" />
    </div>
  )
}


function Titlebar({ onToggleSidebar }) {
  const location = useLocation()

  const [title, setTitle] = useState('')

  useEffect(() => {
    switch (location.pathname) {
      case '/':
        setTitle('Frontpage')
        break
    }
  }, [ location ])

  return (
    <div className="Titlebar">
      <div className="section">
        <Button onClick={onToggleSidebar}>
          <Icon icon="Menu" />
        </Button>
      </div>
      <div className="section title">
        <h1 className="text">{ title }</h1>
      </div>
      <div className="section">
        <WindowControls className="controls" />
      </div>
    </div>
  )
}

export default Titlebar
