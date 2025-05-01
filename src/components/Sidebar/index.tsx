import { NavLink } from 'react-router'

import './styles.scss'

function Sidebar({ show }) {
  return (
    <div className={`Sidebar ${!show ? '-closed' : ''}`}>
    </div>
  )
}

export default Sidebar
